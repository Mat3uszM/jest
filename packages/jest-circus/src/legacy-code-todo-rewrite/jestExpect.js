/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {RawMatcherFn} from 'types/Matchers';

import expect, {setState, extend, assertions, hasAssertions} from 'expect';

import {
  addSerializer,
  toMatchSnapshot,
  toMatchInlineSnapshot,
  toThrowErrorMatchingSnapshot,
  toThrowErrorMatchingInlineSnapshot,
} from 'jest-snapshot';

type JasmineMatcher = {
  (): JasmineMatcher,
  compare: () => RawMatcherFn,
  negativeCompare: () => RawMatcherFn,
};

export default (config: {expand: boolean}) => {
  global.expect = expect;
  setState({expand: config.expand});
  extend({
    toMatchInlineSnapshot,
    toMatchSnapshot,
    toThrowErrorMatchingInlineSnapshot,
    toThrowErrorMatchingSnapshot,
  });
  global.expect.extend = extend;
  global.expect.assertions = assertions;
  global.expect.hasAssertions = hasAssertions;

  (expect: Object).addSnapshotSerializer = addSerializer;
};
