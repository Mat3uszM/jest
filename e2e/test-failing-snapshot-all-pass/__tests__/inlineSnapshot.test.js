/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

test.failing('inline snapshot not updated', () => {
  // eslint-disable-next-line quotes
  expect('1').toMatchInlineSnapshot(`"1"`);
});
