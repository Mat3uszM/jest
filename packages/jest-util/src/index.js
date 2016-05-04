/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const FakeTimers = require('./FakeTimers');
const JasmineFormatter = require('./JasmineFormatter');

const installCommonGlobals = require('./installCommonGlobals');
const formatFailureMessage = require('./formatFailureMessage');
const path = require('path');

function escapeStrForRegex(str) {
  return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function replacePathSepForRegex(str) {
  if (path.sep === '\\') {
    return str.replace(/(\/|\\)/g, '\\\\');
  }
  return str;
}

exports.escapeStrForRegex = escapeStrForRegex;
exports.FakeTimers = FakeTimers;
exports.formatFailureMessage = formatFailureMessage;
exports.JasmineFormatter = JasmineFormatter;
exports.installCommonGlobals = installCommonGlobals;
exports.replacePathSepForRegex = replacePathSepForRegex;
