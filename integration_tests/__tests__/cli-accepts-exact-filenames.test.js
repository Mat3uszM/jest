/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const path = require('path');
const skipOnWindows = require('skipOnWindows');
const {extractSummary, cleanup, writeFiles} = require('../utils');
const runJest = require('../runJest');

const DIR = path.resolve(__dirname, '../cli_accepts_exact_filenames');

skipOnWindows.suite();

beforeEach(() => cleanup(DIR));
afterAll(() => cleanup(DIR));

test('CLI accepts exact filenames', () => {
  writeFiles(DIR, {
    'bar.js': `
      test('bar', () => console.log('Hey'));
    `,
    'foo/baz.js': `
      test('baz', () => console.log('Hey'));
    `,
    'package.json': '{}',
  });

  const {stderr, stdout, status} = runJest(DIR, [
    '-i',
    '--ci=false',
    '--forceExit',
    './bar.js',
    './foo/baz.js',
  ]);
  const {rest, summary} = extractSummary(stderr);
  expect(status).toBe(0);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
  expect(stdout).toMatchSnapshot();
});
