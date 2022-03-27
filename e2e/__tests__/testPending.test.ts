/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {extractSummary} from '../Utils';
import runJest from '../runJest';
const dir = path.resolve(__dirname, '../test-pending');

test('works with all statuses', () => {
  const result = runJest(dir, ['statuses.test.js']);
  expect(result.exitCode).toBe(1);
  const {rest} = extractSummary(result.stderr);
  expect(rest).toMatchSnapshot();
});
