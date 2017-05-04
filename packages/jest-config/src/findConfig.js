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

import type {InitialOptions, Path} from 'types/Config';

const fs = require('fs');
const jsonlint = require('./vendor/jsonlint');
const path = require('path');

const JEST_CONFIG = 'jest.config.js';
const PACKAGE_JSON = 'package.json';

const findConfig = (root: Path): InitialOptions => {
  // $FlowFixMe
  let options: InitialOptions = {};
  let directory = root;
  const isJS = directory.endsWith('.js');
  if (isJS || directory.endsWith('.json')) {
    const filePath = path.resolve(process.cwd(), directory);
    if (isJS) {
      // $FlowFixMe
      options = require(filePath);
    } else {
      let pkg;
      try {
        // $FlowFixMe
        pkg = require(filePath);
      } catch (error) {
        throw new Error(
          `Jest: Failed to parse config file ${filePath}\n` +
            `  ${jsonlint.errors(fs.readFileSync(filePath, 'utf8'))}`,
        );
      }
      if (directory.endsWith(PACKAGE_JSON)) {
        options = pkg.jest || options;
      } else {
        options = pkg;
      }
    }
    options.rootDir = options.rootDir
      ? path.resolve(path.dirname(directory), options.rootDir)
      : path.dirname(directory);
    return options;
  }

  do {
    const configJsFilePath = path.join(directory, JEST_CONFIG);
    if (fs.existsSync(configJsFilePath)) {
      // $FlowFixMe
      options = require(configJsFilePath);
      break;
    }
    const packageJsonFilePath = path.join(directory, PACKAGE_JSON);
    if (fs.existsSync(packageJsonFilePath)) {
      // $FlowFixMe
      const pkg = require(packageJsonFilePath);
      if (pkg.jest) {
        options = pkg.jest;
      }
      // Even if there is no configuration, we stop traveling up the
      // tree if we hit a `package.json` file.
      break;
    }
  } while (directory !== (directory = path.dirname(directory)));

  options.rootDir = options.rootDir
    ? path.resolve(root, options.rootDir)
    : root;

  return options;
};

module.exports = findConfig;
