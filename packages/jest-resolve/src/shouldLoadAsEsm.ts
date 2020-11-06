/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {dirname, extname} from 'path';
// @ts-expect-error: experimental, not added to the types
import {SyntheticModule} from 'vm';
import escalade from 'escalade/sync';
import {readFileSync} from 'graceful-fs';
import type {Config} from '@jest/types';

const runtimeSupportsVmModules = typeof SyntheticModule === 'function';

const cachedFileLookups = new Map<string, boolean>();
const cachedDirLookups = new Map<string, boolean>();
const cachedChecks = new Map<string, boolean>();

export function clearCachedLookups(): void {
  cachedFileLookups.clear();
  cachedDirLookups.clear();
  cachedChecks.clear();
}

export default function cachedShouldLoadAsEsm(path: Config.Path): boolean {
  let cachedLookup = cachedFileLookups.get(path);

  if (cachedLookup === undefined) {
    cachedLookup = shouldLoadAsEsm(path);
    cachedFileLookups.set(path, cachedLookup);
  }

  return cachedLookup;
}

// this is a bad version of what https://github.com/nodejs/modules/issues/393 would provide
function shouldLoadAsEsm(path: Config.Path): boolean {
  if (!runtimeSupportsVmModules) {
    return false;
  }

  const extension = extname(path);

  if (extension === '.mjs') {
    return true;
  }

  if (extension === '.cjs') {
    return false;
  }

  // this isn't correct - we might wanna load any file as a module (using synthetic module)
  // do we need an option to Jest so people can opt in to ESM for non-js?
  if (extension !== '.js') {
    return false;
  }

  const cwd = dirname(path);

  let cachedLookup = cachedDirLookups.get(cwd);

  if (cachedLookup === undefined) {
    cachedLookup = cachedPkgCheck(cwd);
    cachedFileLookups.set(cwd, cachedLookup);
  }

  return cachedLookup;
}

function cachedPkgCheck(cwd: Config.Path): boolean {
  const pkgPath = escalade(cwd, (_dir, names) => {
    if (names.includes('package.json')) {
      // will be resolved into absolute
      return 'package.json';
    }
    return false;
  });
  if (!pkgPath) {
    return false;
  }

  let hasModuleField = cachedChecks.get(pkgPath);
  if (hasModuleField != null) {
    return hasModuleField;
  }

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    hasModuleField = pkg.type === 'module';
  } catch {
    hasModuleField = false;
  }

  cachedChecks.set(pkgPath, hasModuleField);
  return hasModuleField;
}
