/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

import type {Config} from 'types/Config';
import type {HasteMap, HasteContext} from 'types/HasteMap';

const Runtime = require('jest-runtime');

const createHasteContext = (
  config: Config,
  {hasteFS, moduleMap}: HasteMap,
): HasteContext => ({
  hasteFS,
  resolver: Runtime.createResolver(config, moduleMap),
});

module.exports = createHasteContext;
