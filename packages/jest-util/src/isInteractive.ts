/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {isCI} from 'ci-info';

export default process.stdout.isTTY != null &&
  process.env.TERM !== 'dumb' &&
  !isCI;
