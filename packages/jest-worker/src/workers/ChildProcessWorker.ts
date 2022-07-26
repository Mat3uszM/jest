/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {ChildProcess, ForkOptions, fork} from 'child_process';
import {totalmem} from 'os';
import {PassThrough} from 'stream';
import mergeStream = require('merge-stream');
import {stdout as stdoutSupportsColor} from 'supports-color';
import {
  CHILD_MESSAGE_INITIALIZE,
  CHILD_MESSAGE_MEM_USAGE,
  ChildMessage,
  ChildProcessWorkerOptions,
  OnCustomMessage,
  OnEnd,
  OnStart,
  PARENT_MESSAGE_CLIENT_ERROR,
  PARENT_MESSAGE_CUSTOM,
  PARENT_MESSAGE_MEM_USAGE,
  PARENT_MESSAGE_OK,
  PARENT_MESSAGE_SETUP_ERROR,
  ParentMessage,
  WorkerInterface,
  WorkerOptions,
} from '../types';

const SIGNAL_BASE_EXIT_CODE = 128;
const SIGKILL_EXIT_CODE = SIGNAL_BASE_EXIT_CODE + 9;
const SIGTERM_EXIT_CODE = SIGNAL_BASE_EXIT_CODE + 15;

// How long to wait after SIGTERM before sending SIGKILL
const SIGKILL_DELAY = 500;

/**
 * This class wraps the child process and provides a nice interface to
 * communicate with. It takes care of:
 *
 *  - Re-spawning the process if it dies.
 *  - Queues calls while the worker is busy.
 *  - Re-sends the requests if the worker blew up.
 *
 * The reason for queueing them here (since childProcess.send also has an
 * internal queue) is because the worker could be doing asynchronous work, and
 * this would lead to the child process to read its receiving buffer and start a
 * second call. By queueing calls here, we don't send the next call to the
 * children until we receive the result of the previous one.
 *
 * As soon as a request starts to be processed by a worker, its "processed"
 * field is changed to "true", so that other workers which might encounter the
 * same call skip it.
 */
export default class ChildProcessWorker implements WorkerInterface {
  private _child!: ChildProcess;
  private _options: WorkerOptions;

  private _request: ChildMessage | null;
  private _retries!: number;
  private _onProcessEnd!: OnEnd;
  private _onCustomMessage!: OnCustomMessage;

  private _fakeStream: PassThrough | null;
  private _stdout: ReturnType<typeof mergeStream> | null;
  private _stderr: ReturnType<typeof mergeStream> | null;

  private _exitPromise: Promise<void>;
  private _resolveExitPromise!: () => void;

  private _memoryUsagePromise: Promise<number> | undefined;
  private _resolveMemoryUsage: ((arg0: number) => void) | undefined;

  private _childIdleMemoryUsage: number | null;
  private _childIdleMemoryUsageLimit: number | null;
  private _restarting = false;
  private _memoryUsageCheck = false;

  private _childWorkerPath: string;

  constructor(options: ChildProcessWorkerOptions) {
    this._options = options;

    this._request = null;

    this._fakeStream = null;
    this._stdout = null;
    this._stderr = null;
    this._childIdleMemoryUsage = null;
    this._childIdleMemoryUsageLimit = options.idleMemoryLimit || null;

    this._exitPromise = new Promise(resolve => {
      this._resolveExitPromise = resolve;
    });

    this._childWorkerPath =
      options.childWorkerPath || require.resolve('./processChild');

    this.initialize();
  }

  initialize(): void {
    this._restarting = false;

    const forceColor = stdoutSupportsColor ? {FORCE_COLOR: '1'} : {};
    const options: ForkOptions = {
      cwd: process.cwd(),
      env: {
        ...process.env,
        JEST_WORKER_ID: String(this._options.workerId + 1), // 0-indexed workerId, 1-indexed JEST_WORKER_ID
        ...forceColor,
      },
      // Suppress --debug / --inspect flags while preserving others (like --harmony).
      execArgv: process.execArgv.filter(v => !/^--(debug|inspect)/.test(v)),
      // default to advanced serialization in order to match worker threads
      serialization: 'advanced',
      silent: true,
      ...this._options.forkOptions,
    };

    const child = fork(this._childWorkerPath, [], options);

    if (child.stdout) {
      if (!this._stdout) {
        // We need to add a permanent stream to the merged stream to prevent it
        // from ending when the subprocess stream ends
        this._stdout = mergeStream(this._getFakeStream());
      }

      this._stdout.add(child.stdout);
    }

    if (child.stderr) {
      if (!this._stderr) {
        // We need to add a permanent stream to the merged stream to prevent it
        // from ending when the subprocess stream ends
        this._stderr = mergeStream(this._getFakeStream());
      }

      this._stderr.add(child.stderr);
    }

    child.on('message', this._onMessage.bind(this));
    child.on('exit', this._onExit.bind(this));

    child.send([
      CHILD_MESSAGE_INITIALIZE,
      false,
      this._options.workerPath,
      this._options.setupArgs,
    ]);

    this._child = child;

    this._retries++;

    // If we exceeded the amount of retries, we will emulate an error reply
    // coming from the child. This avoids code duplication related with cleaning
    // the queue, and scheduling the next call.
    if (this._retries > this._options.maxRetries) {
      const error = new Error(
        `Jest worker encountered ${this._retries} child process exceptions, exceeding retry limit`,
      );

      this._onMessage([
        PARENT_MESSAGE_CLIENT_ERROR,
        error.name,
        error.message,
        error.stack!,
        {type: 'WorkerError'},
      ]);
    }
  }

  private _shutdown() {
    // End the temporary streams so the merged streams end too
    if (this._fakeStream) {
      this._fakeStream.end();
      this._fakeStream = null;
    }

    this._resolveExitPromise();
  }

  private _onMessage(response: ParentMessage) {
    // TODO: Add appropriate type check
    let error: any;

    switch (response[0]) {
      case PARENT_MESSAGE_OK:
        this._onProcessEnd(null, response[1]);
        break;

      case PARENT_MESSAGE_CLIENT_ERROR:
        error = response[4];

        if (error != null && typeof error === 'object') {
          const extra = error;
          // @ts-expect-error: no index
          const NativeCtor = globalThis[response[1]];
          const Ctor = typeof NativeCtor === 'function' ? NativeCtor : Error;

          error = new Ctor(response[2]);
          error.type = response[1];
          error.stack = response[3];

          for (const key in extra) {
            error[key] = extra[key];
          }
        }

        this._onProcessEnd(error, null);
        break;

      case PARENT_MESSAGE_SETUP_ERROR:
        error = new Error(`Error when calling setup: ${response[2]}`);

        error.type = response[1];
        error.stack = response[3];

        this._onProcessEnd(error, null);
        break;
      case PARENT_MESSAGE_CUSTOM:
        this._onCustomMessage(response[1]);
        break;

      case PARENT_MESSAGE_MEM_USAGE:
        this._childIdleMemoryUsage = response[1];

        if (this._resolveMemoryUsage) {
          this._resolveMemoryUsage(response[1]);

          this._resolveMemoryUsage = undefined;
          this._memoryUsagePromise = undefined;
        }

        this._performRestartIfRequired();

        break;

      default:
        throw new TypeError(`Unexpected response from worker: ${response[0]}`);
    }
  }

  private _performRestartIfRequired(): void {
    if (this._memoryUsageCheck) {
      this._memoryUsageCheck = false;

      let limit = this._childIdleMemoryUsageLimit;

      if (limit && limit > 0 && limit <= 1) {
        limit = Math.floor(totalmem() * limit);
      }

      if (
        limit &&
        this._childIdleMemoryUsage &&
        this._childIdleMemoryUsage > limit
      ) {
        this._restarting = true;

        this.killChild();
      }
    }
  }

  private _onExit(exitCode: number | null, signal: NodeJS.Signals | null) {
    if (
      (exitCode !== 0 &&
        exitCode !== null &&
        exitCode !== SIGTERM_EXIT_CODE &&
        exitCode !== SIGKILL_EXIT_CODE) ||
      this._restarting
    ) {
      this.initialize();

      if (this._request) {
        this._child.send(this._request);
      }
    } else {
      if (signal === 'SIGABRT') {
        // When a child process worker crashes due to lack of memory this prevents
        // jest from spinning and failing to exit. It could be argued it should restart
        // the process, but if you're running out of memory then restarting processes
        // is only going to make matters worse.
        this._onProcessEnd(
          new Error(`Process exited unexpectedly: ${signal}`),
          null,
        );
      }

      this._shutdown();
    }
  }

  send(
    request: ChildMessage,
    onProcessStart: OnStart,
    onProcessEnd: OnEnd,
    onCustomMessage: OnCustomMessage,
  ): void {
    onProcessStart(this);

    this._onProcessEnd = (...args) => {
      if (this._childIdleMemoryUsageLimit && this._child.connected) {
        this.checkMemoryUsage();
      }

      // Clean the request to avoid sending past requests to workers that fail
      // while waiting for a new request (timers, unhandled rejections...)
      this._request = null;
      return onProcessEnd(...args);
    };

    this._onCustomMessage = (...arg) => onCustomMessage(...arg);

    this._request = request;
    this._retries = 0;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    this._child.send(request, () => {});
  }

  waitForExit(): Promise<void> {
    return this._exitPromise;
  }

  killChild(): NodeJS.Timeout {
    this._child.kill('SIGTERM');
    return setTimeout(() => this._child.kill('SIGKILL'), SIGKILL_DELAY);
  }

  forceExit(): void {
    const sigkillTimeout = this.killChild();
    this._exitPromise.then(() => clearTimeout(sigkillTimeout));
  }

  getWorkerId(): number {
    return this._options.workerId;
  }

  /**
   * Gets the process id of the worker.
   *
   * @returns Process id.
   */
  getWorkerPid(): number {
    return this._child.pid;
  }

  getStdout(): NodeJS.ReadableStream | null {
    return this._stdout;
  }

  getStderr(): NodeJS.ReadableStream | null {
    return this._stderr;
  }

  /**
   * Gets the last reported memory usage.
   *
   * @returns Memory usage in bytes.
   */
  getMemoryUsage(): Promise<number | null> {
    if (!this._memoryUsagePromise) {
      let rejectCallback!: (err: Error) => void;

      const promise = new Promise<number>((resolve, reject) => {
        this._resolveMemoryUsage = resolve;
        rejectCallback = reject;
      });
      this._memoryUsagePromise = promise;

      if (!this._child.connected && rejectCallback) {
        rejectCallback(new Error('Child process is not running.'));

        this._memoryUsagePromise = undefined;
        this._resolveMemoryUsage = undefined;

        return promise;
      }

      this._child.send([CHILD_MESSAGE_MEM_USAGE], err => {
        if (err && rejectCallback) {
          this._memoryUsagePromise = undefined;
          this._resolveMemoryUsage = undefined;

          rejectCallback(err);
        }
      });

      return promise;
    }

    return this._memoryUsagePromise;
  }

  /**
   * Gets updated memory usage and restarts if required
   */
  checkMemoryUsage(): void {
    if (this._childIdleMemoryUsageLimit) {
      this._memoryUsageCheck = true;
      this._child.send([CHILD_MESSAGE_MEM_USAGE], err => {
        if (err) {
          console.error('Unable to check memory usage', err);
        }
      });
    } else {
      console.warn(
        'Memory usage of workers can only be checked if a limit is set',
      );
    }
  }

  private _getFakeStream() {
    if (!this._fakeStream) {
      this._fakeStream = new PassThrough();
    }
    return this._fakeStream;
  }
}
