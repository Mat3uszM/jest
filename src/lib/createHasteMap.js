/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const HasteMap = require('jest-haste-map');

module.exports = function createHasteMap(config, options) {
  const extensions = Array.from(new Set(
    config.moduleFileExtensions.concat(config.testFileExtensions)
  ));
  const ignorePattern = new RegExp(
    [config.cacheDirectory].concat(config.modulePathIgnorePatterns).join('|')
  );

  return new HasteMap({
    cacheDirectory: config.cacheDirectory,
    extensions,
    ignorePattern,
    maxWorkers: options && options.maxWorkers,
    mocksPattern: config.mocksPattern,
    platforms: config.haste.platforms || ['ios', 'android'],
    providesModuleNodeModules: config.haste.providesModuleNodeModules,
    resetCache: options && options.resetCache,
    roots: config.testPathDirs,
    useWatchman: config.watchman,
  });
};
