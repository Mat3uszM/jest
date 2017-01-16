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

const chalk = require('chalk');
const BULLET: string = chalk.bold('\u25cf');
const DEPRECATION = `${BULLET} Deprecation Warning`;
const ERROR = `${BULLET} Validation Error`;
const WARNING = `${BULLET} Validation Warning`;

const format = (value: string): string =>
  require('pretty-format')(value, {min: true});

class ValidationError extends Error {
  name: string;
  message: string;

  constructor(name: string, message: string, comment: ?string) {
    super();
    comment = comment ? '\n\n' + comment : '\n';
    this.name = '';
    this.message = chalk.red(chalk.bold(name) + ':\n\n' + message + comment);
    Error.captureStackTrace(this, () => {});
  }
}

const logValidationWarning = (
  name: string,
  message: string,
  comment?: ?string,
) => {
  comment = comment ? '\n\n' + comment : '\n';
  console.warn(chalk.yellow(chalk.bold(name) + ':\n\n' + message + comment));
};

module.exports = {
  DEPRECATION,
  ERROR,
  ValidationError,
  WARNING,
  format,
  logValidationWarning,
};
