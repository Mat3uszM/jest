/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {AssertionError, strict as assert} from 'assert';
import {Console} from 'console';
import {InspectOptions, format, formatWithOptions, inspect} from 'util';
import chalk = require('chalk');
import {ErrorWithStack, formatTime} from 'jest-util';
import type {
  ConsoleBuffer,
  LogCounters,
  LogMessage,
  LogTimers,
  LogType,
} from './types';

export default class BufferedConsole extends Console {
  private readonly _buffer: ConsoleBuffer = [];
  private _counters: LogCounters = {};
  private _timers: LogTimers = {};
  private _groupDepth = 0;

  override Console: typeof Console = Console;

  constructor() {
    super({
      write: (message: string) => {
        BufferedConsole.write(this._buffer, 'log', message, null);

        return true;
      },
    } as NodeJS.WritableStream);
  }

  static write(
    this: void,
    buffer: ConsoleBuffer,
    type: LogType,
    message: LogMessage,
    level?: number | null,
  ): ConsoleBuffer {
    const stackLevel = level != null ? level : 2;
    const rawStack = new ErrorWithStack(undefined, BufferedConsole.write).stack;

    invariant(rawStack != null, 'always have a stack trace');

    const origin = rawStack
      .split('\n')
      .slice(stackLevel)
      .filter(Boolean)
      .join('\n');

    buffer.push({
      message,
      origin,
      type,
    });

    return buffer;
  }

  private _log(type: LogType, message: LogMessage) {
    BufferedConsole.write(
      this._buffer,
      type,
      '  '.repeat(this._groupDepth) + message,
      3,
    );
  }

  override assert(value: unknown, message?: string | Error): void {
    try {
      assert(value, message);
    } catch (error) {
      if (!(error instanceof AssertionError)) {
        throw error;
      }
      this._log('assert', error.toString());
    }
  }

  override count(label = 'default'): void {
    if (!this._counters[label]) {
      this._counters[label] = 0;
    }

    this._log('count', format(`${label}: ${++this._counters[label]}`));
  }

  override countReset(label = 'default'): void {
    this._counters[label] = 0;
  }

  override debug(firstArg: unknown, ...rest: Array<unknown>): void {
    this._log('debug', format(firstArg, ...rest));
  }

  override dir(firstArg: unknown, options: InspectOptions = {}): void {
    const representation = inspect(firstArg, options);
    this._log('dir', formatWithOptions(options, representation));
  }

  override dirxml(firstArg: unknown, ...rest: Array<unknown>): void {
    this._log('dirxml', format(firstArg, ...rest));
  }

  override error(firstArg: unknown, ...rest: Array<unknown>): void {
    this._log('error', format(firstArg, ...rest));
  }

  override group(title?: string, ...rest: Array<unknown>): void {
    this._groupDepth++;

    if (title != null || rest.length > 0) {
      this._log('group', chalk.bold(format(title, ...rest)));
    }
  }

  override groupCollapsed(title?: string, ...rest: Array<unknown>): void {
    this._groupDepth++;

    if (title != null || rest.length > 0) {
      this._log('groupCollapsed', chalk.bold(format(title, ...rest)));
    }
  }

  override groupEnd(): void {
    if (this._groupDepth > 0) {
      this._groupDepth--;
    }
  }

  override info(firstArg: unknown, ...rest: Array<unknown>): void {
    this._log('info', format(firstArg, ...rest));
  }

  override log(firstArg: unknown, ...rest: Array<unknown>): void {
    this._log('log', format(firstArg, ...rest));
  }

  override time(label = 'default'): void {
    if (this._timers[label] != null) {
      return;
    }

    this._timers[label] = new Date();
  }

  override timeEnd(label = 'default'): void {
    const startTime = this._timers[label];

    if (startTime != null) {
      const endTime = new Date();
      const time = endTime.getTime() - startTime.getTime();
      this._log('time', format(`${label}: ${formatTime(time)}`));
      delete this._timers[label];
    }
  }

  override timeLog(label = 'default', ...data: Array<unknown>): void {
    const startTime = this._timers[label];

    if (startTime != null) {
      const endTime = new Date();
      const time = endTime.getTime() - startTime.getTime();
      this._log('time', format(`${label}: ${formatTime(time)}`, ...data));
    }
  }

  override warn(firstArg: unknown, ...rest: Array<unknown>): void {
    this._log('warn', format(firstArg, ...rest));
  }

  getBuffer(): ConsoleBuffer | undefined {
    return this._buffer.length ? this._buffer : undefined;
  }
}

function invariant(condition: boolean, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
