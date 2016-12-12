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

import type {DefaultConfig} from 'types/Config';

const constants = require('./constants');
const os = require('os');
const path = require('path');
const {replacePathSepForRegex} = require('jest-util');
const findCacheDir = require('find-cache-dir');

const cacheDir = findCacheDir({name: 'jest'});
const fallbackCacheDir = path.join(os.tmpdir(), 'jest');
const NODE_MODULES_REGEXP = replacePathSepForRegex(constants.NODE_MODULES);

module.exports = ({
  automock: false,
  bail: false,
  browser: false,
  cacheDirectory: cacheDir || fallbackCacheDir,
  coveragePathIgnorePatterns: [NODE_MODULES_REGEXP],
  coverageReporters: ['json', 'text', 'lcov', 'clover'],
  expand: false,
  globals: {},
  haste: {
    providesModuleNodeModules: [],
  },
  mocksPattern: '__mocks__',
  moduleDirectories: ['node_modules'],
  moduleFileExtensions: [
    'js',
    'json',
    'jsx',
    'node',
  ],
  moduleNameMapper: {},
  modulePathIgnorePatterns: [],
  noStackTrace: false,
  notify: false,
  preset: null,
  resetMocks: false,
  resetModules: false,
  snapshotSerializers: [],
  testEnvironment: 'jest-environment-jsdom',
  testPathDirs: ['<rootDir>'],
  testPathIgnorePatterns: [NODE_MODULES_REGEXP],
  testRegex: '(/__tests__/.*|\\.(test|spec))\\.jsx?$',
  testURL: 'about:blank',
  timers: 'real',
  transformIgnorePatterns: [NODE_MODULES_REGEXP],
  useStderr: false,
  verbose: null,
  watch: false,
}: DefaultConfig);
