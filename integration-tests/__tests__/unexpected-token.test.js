/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import runJest from '../runJest';
import os from 'os';
import path from 'path';
const {cleanup, writeFiles} = require('../Utils');

const DIR = path.resolve(os.tmpdir(), 'unexpected-token');

beforeEach(() => cleanup(DIR));
afterEach(() => cleanup(DIR));

test('triggers unexpected token error message for non-JS assets', () => {
  writeFiles(DIR, {
    'asset.css': '.style {}',
    'package.json': JSON.stringify({jest: {testEnvironment: 'node'}}),
  });

  writeFiles(DIR, {
    '__tests__/asset.test.js': `require('../asset.css'); test('asset', () => {});`,
  });

  const {stdout, stderr} = runJest(DIR, ['']);

  expect(stdout).toBe('');
  expect(stderr).toMatch(/Jest encountered an unexpected token/);
  expect(stderr).toMatch(/.style {}/);
  expect(stderr).toMatch(/Unexpected token ./);
});

test('triggers unexpected token error message for untranspiled node_modules', () => {
  writeFiles(DIR, {
    'node_modules/untranspiled-module': 'import {module} from "some-module"',
    'package.json': JSON.stringify({jest: {testEnvironment: 'node'}}),
  });

  writeFiles(DIR, {
    '__tests__/untranspiledModule.test.js': `require('untranspiled-module'); test('untranspiled', () => {});`,
  });

  const {stdout, stderr} = runJest(DIR, ['']);

  expect(stdout).toBe('');
  expect(stderr).toMatch(/Jest encountered an unexpected token/);
  expect(stderr).toMatch(/import {module}/);
  expect(stderr).toMatch(/Unexpected token import/);
});

test('does not trigger unexpected token error message for regular syntax errors', () => {
  writeFiles(DIR, {
    'faulty.js': 'import {module from "some-module"',
    'faulty2.js': 'const name = {first: "Name" second: "Second"}',
    'package.json': JSON.stringify({jest: {testEnvironment: 'node'}}),
  });

  writeFiles(DIR, {
    '__tests__/faulty.test.js': `require('../faulty'); test('faulty', () => {});`,
    '__tests__/faulty2.test.js': `require('../faulty2'); test('faulty2', () => {});`,
  });

  const {stdout, stderr} = runJest(DIR, ['']);

  expect(stdout).toBe('');
  expect(stderr).not.toMatch(/Jest encountered an unexpected token/);
});
