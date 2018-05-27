/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const isWindows = process.platform === 'win32';

export const KEYS = {
  A: 'a',
  ARROW_DOWN: '\u001b[B',
  ARROW_LEFT: '\u001b[D',
  ARROW_RIGHT: '\u001b[C',
  ARROW_UP: '\u001b[A',
  BACKSPACE: isWindows
    ? Buffer.from('08', 'hex').toString()
    : Buffer.from('7f', 'hex').toString(),
  C: 'c',
  CONTROL_C: '\u0003',
  CONTROL_D: '\u0004',
  ENTER: '\r',
  ESCAPE: '\u001b',
  F: 'f',
  I: 'i',
  O: 'o',
  P: 'p',
  Q: 'q',
  QUESTION_MARK: '?',
  R: 'r',
  S: 's',
  T: 't',
  U: 'u',
  W: 'w',
};
