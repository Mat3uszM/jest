/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

'use strict';

import chalk from 'chalk';
import TestWatcher from '../test_watcher';
import {KEYS} from '../constants';

const runJestMock = jest.fn();

jest.doMock('chalk', () => new chalk.constructor({enabled: false}));
jest.doMock(
  '../run_jest',
  () =>
    function() {
      const args = Array.from(arguments);
      const [{onComplete}] = args;
      runJestMock.apply(null, args);

      // Call the callback
      onComplete({snapshot: {}});

      return Promise.resolve();
    },
);

const watch = require('../watch').default;
afterEach(runJestMock.mockReset);

describe('Watch mode flows', () => {
  let outputStream;
  let hasteMapInstances;
  let globalConfig;
  let contexts;
  let stdin;

  beforeEach(() => {
    const config = {roots: [], testPathIgnorePatterns: [], testRegex: ''};
    outputStream = {write: jest.fn()};
    globalConfig = {watch: true};
    hasteMapInstances = [{on: () => {}}];
    contexts = [{config}];
    stdin = new MockStdin();
  });

  it('Correctly passing test path pattern', () => {
    globalConfig.testPathPattern = 'test-*';

    watch({
      contexts,
      globalConfig,
      hasteMapInstances,
      outputStream,
      stdin,
    });

    expect(runJestMock.mock.calls[0][0]).toMatchObject({
      contexts,
      globalConfig,
      onComplete: expect.any(Function),
      outputStream,
      testWatcher: new TestWatcher({isWatchMode: true}),
    });
  });

  it('Correctly passing test name pattern', () => {
    globalConfig.testNamePattern = 'test-*';

    watch({
      contexts,
      globalConfig,
      hasteMapInstances,
      outputStream,
      stdin,
    });

    expect(runJestMock.mock.calls[0][0]).toMatchObject({
      contexts,
      globalConfig,
      onComplete: expect.any(Function),
      outputStream,
      testWatcher: new TestWatcher({isWatchMode: true}),
    });
  });

  it('Runs Jest once by default and shows usage', () => {
    watch({
      contexts,
      globalConfig,
      hasteMapInstances,
      outputStream,
      stdin,
    });
    expect(runJestMock.mock.calls[0][0]).toMatchObject({
      contexts,
      globalConfig,
      onComplete: expect.any(Function),
      outputStream,
      testWatcher: new TestWatcher({isWatchMode: true}),
    });
    expect(outputStream.write.mock.calls.reverse()[0]).toMatchSnapshot();
  });

  it('Pressing "o" runs test in "only changed files" mode', () => {
    watch({
      contexts,
      globalConfig,
      hasteMapInstances,
      outputStream,
      stdin,
    });
    runJestMock.mockReset();

    stdin.emit(KEYS.O);

    expect(runJestMock).toBeCalled();
    expect(runJestMock.mock.calls[0][0].globalConfig).toMatchObject({
      onlyChanged: true,
      watch: true,
      watchAll: false,
    });
  });

  it('Pressing "a" runs test in "watch all" mode', () => {
    watch({
      contexts,
      globalConfig,
      hasteMapInstances,
      outputStream,
      stdin,
    });
    runJestMock.mockReset();

    stdin.emit(KEYS.A);

    expect(runJestMock).toBeCalled();
    expect(runJestMock.mock.calls[0][0].globalConfig).toMatchObject({
      onlyChanged: false,
      watch: false,
      watchAll: true,
    });
  });

  it('Pressing "ENTER" reruns the tests', () => {
    watch({
      contexts,
      globalConfig,
      hasteMapInstances,
      outputStream,
      stdin,
    });
    expect(runJestMock).toHaveBeenCalledTimes(1);
    stdin.emit(KEYS.ENTER);
    expect(runJestMock).toHaveBeenCalledTimes(2);
  });

  it('Pressing "u" reruns the tests in "update snapshot" mode', () => {
    watch({
      contexts,
      globalConfig,
      hasteMapInstances,
      outputStream,
      stdin,
    });
    runJestMock.mockReset();

    stdin.emit(KEYS.U);

    expect(runJestMock.mock.calls[0][0].globalConfig).toMatchObject({
      updateSnapshot: 'all',
      watch: true,
    });

    stdin.emit(KEYS.A);
    // updateSnapshot is not sticky after a run.
    expect(runJestMock.mock.calls[1][0].globalConfig).toMatchObject({
      updateSnapshot: 'none',
      watch: false,
    });
  });
});

class MockStdin {
  constructor() {
    this._callbacks = [];
  }

  setRawMode() {}

  resume() {}

  setEncoding() {}

  on(evt, callback) {
    this._callbacks.push(callback);
  }

  emit(key) {
    this._callbacks.forEach(cb => cb(key));
  }
}
