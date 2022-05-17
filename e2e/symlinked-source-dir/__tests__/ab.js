/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
const a = require('./a');
const b = require('./b');

module.exports = function ab() {
  return a() + b();
};
