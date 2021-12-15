/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {dirname, resolve} from 'path';
import * as fs from 'graceful-fs';
import type {Config} from '@jest/types';
import {tryRealpath} from 'jest-util';

export function clearFsCache(): void {
  checkedPaths.clear();
  checkedRealpathPaths.clear();
  packageContents.clear();
}

enum IPathType {
  FILE = 1,
  DIRECTORY = 2,
  OTHER = 3,
}
const checkedPaths = new Map<string, IPathType>();
function statSyncCached(path: string): IPathType {
  const result = checkedPaths.get(path);
  if (result != null) {
    return result;
  }

  let stat;
  try {
    stat = fs.statSync(path);
  } catch (e: any) {
    if (!(e && (e.code === 'ENOENT' || e.code === 'ENOTDIR'))) {
      throw e;
    }
  }

  if (stat) {
    if (stat.isFile() || stat.isFIFO()) {
      checkedPaths.set(path, IPathType.FILE);
      return IPathType.FILE;
    } else if (stat.isDirectory()) {
      checkedPaths.set(path, IPathType.DIRECTORY);
      return IPathType.DIRECTORY;
    }
  }

  checkedPaths.set(path, IPathType.OTHER);
  return IPathType.OTHER;
}

const checkedRealpathPaths = new Map<string, string>();
function realpathCached(path: Config.Path): Config.Path {
  let result = checkedRealpathPaths.get(path);

  if (result != null) {
    return result;
  }

  result = tryRealpath(path);

  checkedRealpathPaths.set(path, result);

  if (path !== result) {
    // also cache the result in case it's ever referenced directly - no reason to `realpath` that as well
    checkedRealpathPaths.set(result, result);
  }

  return result;
}

export type PkgJson = Record<string, unknown>;

const packageContents = new Map<string, PkgJson>();
export function readPackageCached(path: Config.Path): PkgJson {
  let result = packageContents.get(path);

  if (result != null) {
    return result;
  }

  result = JSON.parse(fs.readFileSync(path, 'utf8')) as PkgJson;

  packageContents.set(path, result);

  return result;
}

// adapted from
// https://github.com/lukeed/escalade/blob/2477005062cdbd8407afc90d3f48f4930354252b/src/sync.js
// to use cached `fs` calls
export function findClosestPackageJson(
  start: Config.Path,
): Config.Path | undefined {
  let dir = resolve('.', start);
  if (!isDirectorySync(dir)) {
    dir = dirname(dir);
  }

  while (true) {
    const pkgJsonFile = resolve(dir, './package.json');
    const hasPackageJson = isFileSync(pkgJsonFile);

    if (hasPackageJson) {
      return pkgJsonFile;
    }

    const prevDir = dir;
    dir = dirname(dir);

    if (prevDir === dir) {
      return undefined;
    }
  }
}

/*
 * helper functions
 */
export function isFileSync(file: Config.Path): boolean {
  return statSyncCached(file) === IPathType.FILE;
}

export function isFileAsync(
  file: Config.Path,
  cb: (err: Error | null, isFile?: boolean) => void,
): void {
  try {
    // TODO: create an async version of statSyncCached
    const isFile = statSyncCached(file) === IPathType.FILE;
    cb(null, isFile);
  } catch (err: any) {
    cb(err);
  }
}

export function isDirectorySync(dir: Config.Path): boolean {
  return statSyncCached(dir) === IPathType.DIRECTORY;
}

export function isDirectoryAsync(
  dir: Config.Path,
  cb: (err: Error | null, isDir?: boolean) => void,
): void {
  try {
    // TODO: create an async version of statSyncCached
    const isDir = statSyncCached(dir) === IPathType.DIRECTORY;
    cb(null, isDir);
  } catch (err: any) {
    cb(err);
  }
}

export function realpathSync(file: Config.Path): Config.Path {
  return realpathCached(file);
}

export function realpathAsync(
  file: Config.Path,
  cb: (err: Error | null, resolved?: Config.Path) => void,
): void {
  try {
    // TODO: create an async version of realpathCached
    const resolved = realpathCached(file);
    cb(null, resolved);
  } catch (err: any) {
    cb(err);
  }
}
