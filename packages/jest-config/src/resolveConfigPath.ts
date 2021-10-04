/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import * as fs from 'graceful-fs';
import type {Config} from '@jest/types';
import {
  JEST_CONFIG_BASE_NAME,
  JEST_CONFIG_EXT_ORDER,
  PACKAGE_JSON,
} from './constants';

const isFile = (filePath: Config.Path) =>
  fs.existsSync(filePath) && !fs.lstatSync(filePath).isDirectory();

const getConfigFilename = (ext: string) => JEST_CONFIG_BASE_NAME + ext;

export default (pathToResolve: Config.Path, cwd: Config.Path): Config.Path => {
  if (!path.isAbsolute(cwd)) {
    throw new Error(`"cwd" must be an absolute path. cwd: ${cwd}`);
  }
  const absolutePath = path.isAbsolute(pathToResolve)
    ? pathToResolve
    : path.resolve(cwd, pathToResolve);

  if (isFile(absolutePath)) {
    return absolutePath;
  }

  // This is a guard against passing non existing path as a project/config,
  // that will otherwise result in a very confusing situation.
  // e.g.
  // With a directory structure like this:
  //   my_project/
  //     packcage.json
  //
  // Passing a `my_project/some_directory_that_doesnt_exist` as a project
  // name will resolve into a (possibly empty) `my_project/package.json` and
  // try to run all tests it finds under `my_project` directory.
  if (!fs.existsSync(absolutePath)) {
    throw new Error(
      `Can't find a root directory while resolving a config file path.\n` +
        `Provided path to resolve: ${pathToResolve}\n` +
        `cwd: ${cwd}`,
    );
  }

  return resolveConfigPathByTraversing(absolutePath, pathToResolve, cwd);
};

const resolveConfigPathByTraversing = (
  pathToResolve: Config.Path,
  initialPath: Config.Path,
  cwd: Config.Path,
): Config.Path => {
  const configFiles = JEST_CONFIG_EXT_ORDER.map(ext =>
    path.resolve(pathToResolve, getConfigFilename(ext)),
  ).filter(isFile);

  const packageJson = findPackageJson(pathToResolve);
  if (packageJson && hasPackageJsonJestKey(packageJson)) {
    configFiles.push(packageJson);
  }

  if (configFiles.length > 1) {
    throw new Error(makeMultipleConfigsError(configFiles));
  }

  if (configFiles.length || packageJson) {
    return configFiles[0] ?? packageJson;
  }

  // This is the system root.
  // We tried everything, config is nowhere to be found ¯\_(ツ)_/¯
  if (pathToResolve === path.dirname(pathToResolve)) {
    throw new Error(makeResolutionErrorMessage(initialPath, cwd));
  }

  // go up a level and try it again
  return resolveConfigPathByTraversing(
    path.dirname(pathToResolve),
    initialPath,
    cwd,
  );
};

const findPackageJson = (pathToResolve: Config.Path) => {
  const packagePath = path.resolve(pathToResolve, PACKAGE_JSON);
  if (isFile(packagePath)) {
    return packagePath;
  }

  return undefined;
};

const hasPackageJsonJestKey = (packagePath: Config.Path) => {
  const content = fs.readFileSync(packagePath, 'utf8');
  try {
    return 'jest' in JSON.parse(content);
  } catch {
    // If package is not a valid JSON
    return false;
  }
};

const makeResolutionErrorMessage = (
  initialPath: Config.Path,
  cwd: Config.Path,
) =>
  'Could not find a config file based on provided values:\n' +
  `path: "${initialPath}"\n` +
  `cwd: "${cwd}"\n` +
  'Config paths must be specified by either a direct path to a config\n' +
  'file, or a path to a directory. If directory is given, Jest will try to\n' +
  `traverse directory tree up, until it finds one of those files in exact order: ${JEST_CONFIG_EXT_ORDER.map(
    ext => `"${getConfigFilename(ext)}"`,
  ).join(' or ')}.`;

const makeMultipleConfigsError = (configPaths: Array<Config.Path>) =>
  '● Multiple configurations found:\n\n' +
  `Jest found configuration in ${concatenateWords(
    configPaths.map(wrapInBackticks),
  )}.\n` +
  'This is not allowed because it is probably a mistake.\n\n' +
  'Configuration Documentation:\n' +
  'https://jestjs.io/docs/configuration.html\n';

const wrapInBackticks = (word: string) => `\`${word}\``;

const concatenateWords = (words: Array<string>): string => {
  if (words.length === 0) {
    throw new Error('Cannot concatenate an empty array.');
  } else if (words.length <= 2) {
    return words.join(' and ');
  } else {
    return concatenateWords([
      words.slice(0, -1).join(', '),
      words[words.length - 1],
    ]);
  }
};
