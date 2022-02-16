/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectError, expectType} from 'tsd-lite';
import {jestExpect} from '@jest/expect';
import {expect} from 'expect';

expectType<void>(jestExpect({}).toMatchSnapshot());

expectError(() => {
  expect({}).toMatchSnapshot();
});
