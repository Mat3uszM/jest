/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {
  MockFunctionMetadata as _MockFunctionMetadata,
  ModuleMocker as _ModuleMocker,
} from 'jest-mock';

export type MockFunctionMetadata = _MockFunctionMetadata;
export type ModuleMocker = _ModuleMocker;

export type MockData = {
  _isMockFunction: true,
  getMockImplementation: () => Function,
  mockClear: Function,
  mockReset: Function,
  mockReturnValueOnce: Function,
  mockReturnValue: Function,
  mockImplementationOnce: Function,
  mockImplementation: Function,
  mockReturnThis: Function,
  mockRestore: Function,
};
