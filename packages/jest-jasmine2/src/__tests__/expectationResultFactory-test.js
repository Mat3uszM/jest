/**
 * Copyright (c) 2015-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */

const expectationResultFactory = require('../expectationResultFactory');

describe('expectationResultFactory', () => {
  it('returns the result if passed.', () => {
    const options = {
      matcherName: 'testMatcher',
      passed: true,
    };
    const result = expectationResultFactory(options);
    expect(result).toMatchSnapshot();
  });

  it('returns the result if failed.', () => {
    const options = {
      actual: 'Fail',
      expected: 'Pass',
      matcherName: 'testMatcher',
      passed: false,
    };
    const result = expectationResultFactory(options);
    expect(result.message).toEqual('');
  });

  it('returns the result if failed (with `message`).', () => {
    const message = 'This message is not "Expected `Pass`, recieved `Fail`."';
    const options = {
      actual: 'Fail',
      error: new Error('This will be ignored in `message`.'),
      expected: 'Pass',
      matcherName: 'testMatcher',
      message,
      passed: false,
    };
    const result = expectationResultFactory(options);
    expect(result.message).toEqual(message);
  });

  it('returns the result if failed (with `error`).', () => {
    const options = {
      actual: 'Fail',
      error: new Error('Expected `Pass`, recieved `Fail`.'),
      expected: 'Pass',
      matcherName: 'testMatcher',
      passed: false,
    };
    const result = expectationResultFactory(options);
    expect(result.message).toEqual('Error: Expected `Pass`, recieved `Fail`.');
  });

  it('returns the result if failed (with `error` as a string).', () => {
    const options = {
      actual: 'Fail',
      error: 'Expected `Pass`, recieved `Fail`.',
      expected: 'Pass',
      matcherName: 'testMatcher',
      passed: false,
    };
    const result = expectationResultFactory(options);
    expect(result.message).toEqual('Expected `Pass`, recieved `Fail`. thrown');
  });
});
