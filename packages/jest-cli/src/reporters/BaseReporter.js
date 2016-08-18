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
import type {RunnerContext} from 'types/Reporters';

const clearLine = require('jest-util').clearLine;
const preRunMessage = require('../preRunMessage');

class BaseReporter {
  _error: ?Error;

  log(message: string) {
    process.stderr.write(message + '\n');
  }

  onRunStart(config: Config, results: AggregatedResult) {
    preRunMessage.remove(process.stderr);
  }

  onTestResult(
    config: Config,
    testResult: TestResult,
    results: AggregatedResult,
  ) {}

  onTestStart(
    config: Config,
    path: Path,
    runnerContext: RunnerContext,
  ) {}

  onRunComplete(
    config: Config,
    aggregatedResults: AggregatedResult,
    runnerContext: RunnerContext,
  ): ?Promise<any> {}

  clearLine() {
    clearLine(process.stderr);
  }

  _write(string: string) {
    process.stderr.write(string);
  }

  _setError(error: Error) {
    this._error = error;
  }

  // Return an error that occured during reporting. This error will
  // define whether the test run was successful or failed.
  getLastError(): ?Error {
    return this._error;
  }
}

module.exports = BaseReporter;
