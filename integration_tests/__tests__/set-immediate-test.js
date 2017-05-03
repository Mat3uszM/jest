/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */

const runJest = require('../runJest');

test('setImmediate', () => {
  const result = runJest('set_immediate', ['--verbose']);
  const stderr = result.stderr.toString();

  expect(stderr).toMatch('setImmediate test');
  expect(result.status).toBe(0);
});
