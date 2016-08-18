/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

import type {AggregatedResult, TestResult} from 'types/TestResult';
import type {Config, Path} from 'types/Config';

const {getSummaryLine, wrapAnsiString, formatTestPath} = require('./utils');
const chalk = require('chalk');
const path = require('path');

const RUNNING = chalk.inverse.bold(' RUNNING ') + ' ';

/**
 * This class is a perf optimization for sorting the list of currently
 * running tests. It tries to keep tests in the same positions without
 * shifting the whole list.
 */
class CurrentlyRunning {
  _array: Array<{testPath: Path, config: Config} | null>;

  constructor() {
    this._array = [];
  }

  add(testPath, config) {
    const index = this._array.indexOf(null);
    const record = {testPath, config};
    index !== -1 ? this._array[index] = record : this._array.push(record);
  }

  delete(testPath) {
    const record = this._array.find(
      (record, i) => record && record.testPath === testPath,
    );
    this._array[this._array.indexOf(record || null)] = null;
  }

  get() {
    return this._array;
  }
}

/**
 * A class that generates the CLI status of currently running tests
 * and also provides an ANSI escape sequence to remove status lines
 * from the terminal.
 */
class Status {
  _cache: ?{content: string, clear: string};
  _callback: () => void;
  _currentlyRunning: CurrentlyRunning;
  _done: boolean;
  _emitScheduled: boolean;
  _height: number;
  _interval: number;
  _lastAggregatedResults: AggregatedResult;
  _lastUpdated: number;

  constructor() {
    this._done = false;
    this._emitScheduled = false;
    this._cache = null;
    this._currentlyRunning = new CurrentlyRunning();
    this._height = 0;
  }

  onChange(callback: () => void) {
    this._callback = callback;
  }

  runStarted(aggregatedResults: AggregatedResult) {
    this._interval = setInterval(() => this._tick(), 1000);
    this._lastAggregatedResults = aggregatedResults;
    this._debouncedEmit();
  }

  runFinished() {
    this._done = true;
    clearInterval(this._interval);
    this._emit();
  }

  testStarted(testPath: Path, config: Config) {
    this._currentlyRunning.add(testPath, config);
    this._debouncedEmit();
  }

  testFinished(
    config: Config,
    testResult: TestResult,
    aggregatedResults: AggregatedResult,
  ) {
    const {testFilePath} = testResult;
    this._lastAggregatedResults = aggregatedResults;
    this._currentlyRunning.delete(testFilePath);
    this._debouncedEmit();
  }

  get() {
    if (this._cache) {
      return this._cache;
    }

    if (this._done) {
      return {content: '', clear: ''};
    }
    // $FlowFixMe
    const columns: number = process.stdout.columns;
    let content = '\n'; // status can't share lines with anything else
    this._currentlyRunning.get().forEach(record => {
      if (record) {
        const {config, testPath} = record;
        content += wrapAnsiString(
          RUNNING + formatTestPath(config, testPath),
          columns,
        ) + '\n';
      }
    });

    if (this._lastAggregatedResults) {
      content += '\n' + getSummaryLine(
        this._lastAggregatedResults,
        {roundTime: true, currentSuites: true, width: columns},
      );
    }

    content += '\n';

    let clear = '';

    let height = 1;

    for (let i = 0; i < content.length; i++) {
      content[i] === '\n' && height++;
    }

    for (let i = 0; i < height - 1; i++) {
      clear += '\r\x1B[K\r\x1B[1A';
    }

    this._cache = {content, clear};
    return this._cache;
  }

  _emit() {
    this._cache = null;
    this._lastUpdated = Date.now();
    this._callback();
  }

  _debouncedEmit() {
    if (!this._emitScheduled) {
      // perf optimization to avoid two separate renders When
      // one test finishes and another test starts executing.
      this._emitScheduled = true;
      setTimeout(() => {
        this._emit();
        this._emitScheduled = false;
      }, 100);
    }
  }

  _tick() {
    this._debouncedEmit();
  }
}

// algorith to make test path fit the terminal screen by trimming either
// dirname, or both dirname and basename
// 123/abc.js -> ..3/abc.js
// 123/abcdef.js -> ..def.js
// 123/abc.js -> .../abc.js
const trimAndFormatPath = (pad, dirname, basename, columns) => {
  const maxLength = columns - pad;

  // length is ok
  if ((dirname + path.sep + basename).length <= maxLength) {
    return chalk.dim(dirname + path.sep) + chalk.bold(basename);
  }

  // we can fit trimmed dirname and full basename
  const basenameLength = basename.length;
  if (basenameLength + 4 < maxLength) {
    const dirnameLength = maxLength - 4 - basenameLength;
    dirname = '...' +
      dirname.slice(dirname.length - dirnameLength, dirname.length);
    return chalk.dim(dirname + path.sep) + chalk.bold(basename);
  }

  if (basenameLength + 4 === maxLength) {
    return chalk.dim('...' + path.sep) + chalk.bold(basename);
  }

  // can't fit dirname, but can fit trimmed basename
  return chalk.bold(
    '...' +
    basename.slice(basename.length - maxLength - 4, basename.length),
  );
};

module.exports = Status;
(module.exports: any).trimAndFormatPath = trimAndFormatPath;
