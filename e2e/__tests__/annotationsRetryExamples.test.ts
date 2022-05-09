/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

let i = 0;

jest.retryTimes(1, {logErrorsBeforeRetry: true});

describe('nested', () => {
  test('logging retryTimes example', () => {
    i++;

    if (i === 3) {
      expect(true).toBeTruthy();
    } else {
      expect(true).toBeFalsy();
    }
  });
});
