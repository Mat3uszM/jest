/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
/* global stream$Writable */

import type {LogType, LogMessage, LogCounters, LogTimers} from 'types/Console';

import {format} from 'util';
import {Console} from 'console';
import chalk from 'chalk';
import clearLine from './clear_line';

type Formatter = (type: LogType, message: LogMessage) => string;

export default class CustomConsole extends Console {
  _stdout: stream$Writable;
  _formatBuffer: Formatter;
  _counters: LogCounters;
  _timers: LogTimers;
  _groupDepth: number;

  constructor(
    stdout: stream$Writable,
    stderr: stream$Writable,
    formatBuffer: ?Formatter,
  ) {
    super(stdout, stderr);
    this._formatBuffer = formatBuffer || ((type, message) => message);
    this._counters = {};
    this._timers = {};
    this._groupDepth = 0;
  }

  _logToParentConsole(message: string) {
    super.log(message);
  }

  _log(type: LogType, message: string) {
    clearLine(this._stdout);
    this._logToParentConsole(
      this._formatBuffer(type, '  '.repeat(this._groupDepth) + message),
    );
  }

  assert(...args: Array<any>) {
    if (args[0]) {
      this._log('assert', format(...args.slice(1)));
    }
  }

  count(label: string = 'default') {
    if (!this._counters[label]) {
      this._counters[label] = 0;
    }

    this._log('count', format(`${label}: ${++this._counters[label]}`));
  }

  countReset(label: string = 'default') {
    this._counters[label] = 0;
  }

  debug(...args: Array<mixed>) {
    this._log('debug', format.apply(null, arguments));
  }

  dir(...args: Array<mixed>) {
    this._log('dir', format.apply(null, arguments));
  }

  dirxml(...args: Array<mixed>) {
    this._log('dirxml', format.apply(null, arguments));
  }

  error(...args: Array<mixed>) {
    this._log('error', format.apply(null, arguments));
  }

  group(...args: Array<mixed>) {
    this._groupDepth++;

    if (args.length > 0) {
      this._log('group', chalk.bold(format.apply(null, arguments)));
    }
  }

  groupCollapsed(...args: Array<mixed>) {
    this._groupDepth++;

    if (args.length > 0) {
      this._log('groupCollapsed', chalk.bold(format.apply(null, arguments)));
    }
  }

  groupEnd() {
    if (this._groupDepth > 0) {
      this._groupDepth--;
    }
  }

  info(...args: Array<mixed>) {
    this._log('info', format.apply(null, arguments));
  }

  log(...args: Array<mixed>) {
    this._log('log', format.apply(null, arguments));
  }

  time(label: string = 'default') {
    if (this._timers[label]) {
      return;
    }

    this._timers[label] = new Date();
  }

  timeEnd(label: string = 'default') {
    const startTime = this._timers[label];

    if (startTime) {
      const endTime = new Date();
      const time = (endTime - startTime) / 1000;
      this._log('time', format(`${label}: ${time}ms`));
      delete this._timers[label];
    }
  }

  warn(...args: Array<mixed>) {
    this._log('warn', format.apply(null, arguments));
  }

  getBuffer() {
    return null;
  }
}
