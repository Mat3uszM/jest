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

export type HasteMap = {
  clocks: WatchmanClocks,
  files: {[filepath: string]: FileMetaData},
  map: {[id: string]: ModuleMap},
  mocks: {[id: string]: string},
};

export type WatchmanClocks = {[filepath: string]: string};

export type FileMetaData = [
  /* id */ string,
  /* mtime */ number,
  /* visited */ 0|1,
  /* dependencies */ Array<string>,
];

export type ModuleMap = {[platform: string]: ModuleMetaData};
export type ModuleMetaData = [
  /* path */ string,
  /* type */ string,
];

export type Options = {
  cacheDirectory?: string;
  extensions: Array<string>;
  ignorePattern: RegExp,
  maxWorkers: number;
  mocksPattern?: string;
  name: string;
  platforms: Array<string>;
  providesModuleNodeModules?: Array<string>;
  resetCache?: boolean;
  roots: Array<string>;
  useWatchman?: boolean;
};
