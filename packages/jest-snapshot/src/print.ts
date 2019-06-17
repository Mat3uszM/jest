/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import diff from 'jest-diff';
import getType, {isPrimitive} from 'jest-get-type';
import {
  EXPECTED_COLOR,
  RECEIVED_COLOR,
  getLabelPrinter,
  printDiffOrStringify,
} from 'jest-matcher-utils';
import prettyFormat from 'pretty-format';
import {unescape} from './utils';

const isLineDiffable = (received: any): boolean => {
  const receivedType = getType(received);

  if (isPrimitive(received)) {
    return typeof received === 'string' && received.includes('\n');
  }

  if (
    receivedType === 'date' ||
    receivedType === 'function' ||
    receivedType === 'regexp'
  ) {
    return false;
  }

  if (received instanceof Error) {
    return false;
  }

  if (
    receivedType === 'object' &&
    typeof (received as any).asymmetricMatch === 'function'
  ) {
    return false;
  }

  return true;
};

export const printDiffOrStringified = (
  expectedSerializedTrimmed: string,
  receivedSerializedTrimmed: string,
  received: unknown,
  expectedLabel: string,
  receivedLabel: string,
  expand: boolean, // CLI options: true if `--expand` or false if `--no-expand`
): string => {
  if (typeof received === 'string') {
    if (
      expectedSerializedTrimmed.length >= 2 &&
      expectedSerializedTrimmed.startsWith('"') &&
      expectedSerializedTrimmed.endsWith('"') &&
      receivedSerializedTrimmed === unescape(prettyFormat(received))
    ) {
      // The expected snapshot looks like a stringified string.
      // The received string has default serialization.

      // Undo default serialization of expected snapshot:
      // Remove enclosing double quote marks.
      // Remove backslash escape preceding backslash here,
      // because unescape replaced it only preceding double quote mark.
      return printDiffOrStringify(
        expectedSerializedTrimmed.slice(1, -1).replace(/\\\\/g, '\\'),
        received,
        expectedLabel,
        receivedLabel,
        expand,
      );
    }

    // Also display diff if strings have application-specific serialization:
    return printDiffOrStringify(
      expectedSerializedTrimmed,
      receivedSerializedTrimmed,
      expectedLabel,
      receivedLabel,
      expand,
    );
  }

  if (
    (expectedSerializedTrimmed.includes('\n') ||
      receivedSerializedTrimmed.includes('\n')) &&
    isLineDiffable(received)
  ) {
    return diff(expectedSerializedTrimmed, receivedSerializedTrimmed, {
      aAnnotation: expectedLabel,
      bAnnotation: receivedLabel,
      expand,
    }) as string;
  }

  const printLabel = getLabelPrinter(expectedLabel, receivedLabel);
  return (
    printLabel(expectedLabel) +
    EXPECTED_COLOR(expectedSerializedTrimmed) +
    '\n' +
    printLabel(receivedLabel) +
    RECEIVED_COLOR(receivedSerializedTrimmed)
  );
};
