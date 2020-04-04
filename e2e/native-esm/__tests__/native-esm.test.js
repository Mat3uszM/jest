/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {double} from '../index';

test('should have correct import.meta', () => {
  expect(typeof jest).toBe('undefined');
  expect(import.meta).toEqual({
    jest: expect.anything(),
    url: expect.any(String),
  });
  expect(
    import.meta.url.endsWith('/e2e/native-esm/__tests__/native-esm.test.js')
  ).toBe(true);
});

test('should double stuff', () => {
  expect(double(1)).toBe(2);
});
