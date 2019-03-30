/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment node
 *
 */

/* eslint-env browser */

'use strict';

test('use document', () => {
  const div = document.createElement('div');

  console.log(div);

  expect(1).toBe(1);
});

test('use window', () => {
  const location = window.location;

  console.log(location);

  expect(1).toBe(1);
});
