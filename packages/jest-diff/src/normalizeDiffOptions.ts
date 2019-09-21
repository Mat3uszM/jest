/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk from 'chalk';

import {DiffOptions, DiffOptionsNormalized} from './types';

const DIFF_CONTEXT_DEFAULT = 5;

const OPTIONS_DEFAULT: DiffOptionsNormalized = {
  aAnnotation: 'Expected',
  aColor: chalk.green,
  aIndicator: '-',
  bAnnotation: 'Received',
  bColor: chalk.red,
  bIndicator: '+',
  changeColor: chalk.inverse,
  commonColor: chalk.dim,
  commonIndicator: ' ',
  contextLines: DIFF_CONTEXT_DEFAULT,
  expand: true,
  firstOrLastEmptyLineReplacement: '\u{21B5}', // downwards arrow with corner leftwards
  includeChangeCounts: false,
  omitAnnotationLines: false,
  patchColor: chalk.yellow,
  trailingSpaceFormatter: chalk.bgYellow,
};

const getContextLines = (contextLines?: number): number =>
  typeof contextLines === 'number' &&
  Number.isSafeInteger(contextLines) &&
  contextLines >= 0
    ? contextLines
    : DIFF_CONTEXT_DEFAULT;

// Pure function returns options with all properties.
export const normalizeDiffOptions = (
  options: DiffOptions = {},
): DiffOptionsNormalized => ({
  ...OPTIONS_DEFAULT,
  ...options,
  contextLines: getContextLines(options.contextLines),
});
