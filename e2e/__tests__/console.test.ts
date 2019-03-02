/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {wrap} from 'jest-snapshot-serializer-raw';
import {extractSummary} from '../Utils';
import runJest from '../runJest';

test('console printing', () => {
  const {stderr, status} = runJest('console');
  const {summary, rest} = extractSummary(stderr);

  expect(status).toBe(0);
  expect(wrap(rest)).toMatchSnapshot();
  expect(wrap(summary)).toMatchSnapshot();
});

test('console printing with --verbose', () => {
  const {stderr, stdout, status} = runJest('console', [
    '--verbose',
    '--no-cache',
  ]);
  const {summary, rest} = extractSummary(stderr);

  expect(status).toBe(0);
  expect(wrap(stdout)).toMatchSnapshot();
  expect(wrap(rest)).toMatchSnapshot();
  expect(wrap(summary)).toMatchSnapshot();
});

test('does not print to console with --silent', () => {
  const {stderr, stdout, status} = runJest('console', [
    // Need to pass --config because console test specifies `verbose: false`
    '--config=' +
      JSON.stringify({
        testEnvironment: 'node',
      }),
    '--silent',
    '--no-cache',
  ]);
  const {summary, rest} = extractSummary(stderr);

  expect(status).toBe(0);
  expect(wrap(stdout)).toMatchSnapshot();
  expect(wrap(rest)).toMatchSnapshot();
  expect(wrap(summary)).toMatchSnapshot();
});

// issue: https://github.com/facebook/jest/issues/5223
test('the jsdom console is the same as the test console', () => {
  const {stderr, stdout, status} = runJest('console-jsdom');
  const {summary, rest} = extractSummary(stderr);

  expect(status).toBe(0);
  expect(wrap(stdout)).toMatchSnapshot();
  expect(wrap(rest)).toMatchSnapshot();
  expect(wrap(summary)).toMatchSnapshot();
});

test('does not error out when using winston', () => {
  const {stderr, stdout, status} = runJest('console-winston');
  const {summary, rest} = extractSummary(stderr);

  expect(wrap(stdout)).toMatchSnapshot();
  expect(wrap(summary)).toMatchSnapshot();
  expect(wrap(rest)).toMatchInlineSnapshot(`
PASS __tests__/console.test.js
FAIL __tests__/console.test.js
  ● Test suite failed to run

    TypeError: message.split is not a function

      at buffer.reduce (../../packages/jest-util/build/getConsoleOutput.js:54:8)
          at Array.reduce (<anonymous>)
`);
  expect(status).toBe(0);
});
