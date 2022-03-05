/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import * as path from 'path';
import runJest from '../runJest';

test('--shard=1/1', () => {
  const result = runJest('shard', ['--shard=1/1', '--listTests']);

  const paths = result.stdout
    .split('\n')
    .filter(Boolean)
    .map(file => path.basename(file));

  expect(paths).toEqual(['3.test.js', '2.test.js', '1.test.js']);
});

test('--shard=1/2', () => {
  const result = runJest('shard', ['--shard=1/2', '--listTests']);

  const paths = result.stdout
    .split('\n')
    .filter(Boolean)
    .map(file => path.basename(file));

  expect(paths).toEqual(['2.test.js', '1.test.js']);
});

test('--shard=2/2', () => {
  const result = runJest('shard', ['--shard=2/2', '--listTests']);

  const paths = result.stdout
    .split('\n')
    .filter(Boolean)
    .map(file => path.basename(file));

  expect(paths).toEqual(['3.test.js']);
});

test('--shard=4/4', () => {
  const result = runJest('shard', ['--shard=4/4', '--listTests']);

  const paths = result.stdout
    .split('\n')
    .filter(Boolean)
    .map(file => path.basename(file));

  // project only has 3 files
  // shards > 3 are empty
  expect(paths).toEqual([]);
});
