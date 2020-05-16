/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {extractSummary, run} from '../Utils';
import runJest from '../runJest';

const dir = path.resolve(__dirname, '..', 'native-async-mock');

test('mocks async functions', () => {
  if (process.versions.node < '7.6.0') {
    return;
  }

  run('yarn', dir);

  // --no-cache because babel can cache stuff and result in false green
  const {stdout} = runJest(dir, ['--no-cache']);
  expect(extractSummary(stdout).summary).toMatch(
    'Test Suites: 1 passed, 1 total',
  );
});
