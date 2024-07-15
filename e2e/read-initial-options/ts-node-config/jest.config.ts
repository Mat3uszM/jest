/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-config-loader ts-node
 */
interface Config {
  jestConfig: string;
}

export default {
  jestConfig: 'jest.config.ts',
} as Config;
