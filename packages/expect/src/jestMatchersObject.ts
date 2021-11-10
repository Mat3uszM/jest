/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {Expect} from '@jest/types';
import {AsymmetricMatcher} from './asymmetricMatchers';

// Global matchers object holds the list of available matchers and
// the state, that can hold matcher specific values that change over time.
const JEST_MATCHERS_OBJECT = Symbol.for('$$jest-matchers-object');

// Notes a built-in/internal Jest matcher.
// Jest may override the stack trace of Errors thrown by internal matchers.
export const INTERNAL_MATCHER_FLAG = Symbol.for('$$jest-internal-matcher');

export type JestRawMatcherFn = Expect.RawMatcherFn & {
  [INTERNAL_MATCHER_FLAG]?: boolean;
};

export type JestMatchersObject = {
  [matcherName: string]: JestRawMatcherFn;
};

if (!global.hasOwnProperty(JEST_MATCHERS_OBJECT)) {
  const defaultState: Partial<Expect.MatcherState> = {
    assertionCalls: 0,
    expectedAssertionsNumber: null,
    isExpectingAssertions: false,
    suppressedErrors: [], // errors that are not thrown immediately.
  };
  Object.defineProperty(global, JEST_MATCHERS_OBJECT, {
    value: {
      matchers: Object.create(null),
      state: defaultState,
    },
  });
}

export const getState = (): Expect.MatcherState =>
  (global as any)[JEST_MATCHERS_OBJECT].state;

export const setState = (state: Partial<Expect.MatcherState>): void => {
  Object.assign((global as any)[JEST_MATCHERS_OBJECT].state, state);
};

export const getMatchers = (): Expect.MatchersObject =>
  (global as any)[JEST_MATCHERS_OBJECT].matchers;

export const setMatchers = (
  matchers: Expect.MatchersObject,
  isInternal: boolean,
  expect: Expect.Expect,
): void => {
  Object.keys(matchers).forEach(key => {
    const matcher = matchers[key];
    Object.defineProperty(matcher, INTERNAL_MATCHER_FLAG, {
      value: isInternal,
    });

    if (!isInternal) {
      // expect is defined

      class CustomMatcher extends AsymmetricMatcher<
        [unknown, ...Array<unknown>]
      > {
        constructor(
          inverse: boolean = false,
          ...sample: [unknown, ...Array<unknown>]
        ) {
          super(sample, inverse);
        }

        asymmetricMatch(other: unknown) {
          const {pass} = matcher.call(
            this.getMatcherContext(),
            other,
            ...this.sample,
          ) as Expect.SyncExpectationResult;

          return this.inverse ? !pass : pass;
        }

        toString() {
          return `${this.inverse ? 'not.' : ''}${key}`;
        }

        getExpectedType() {
          return 'any';
        }

        toAsymmetricMatcher() {
          return `${this.toString()}<${this.sample.map(String).join(', ')}>`;
        }
      }

      Object.defineProperty(expect, key, {
        configurable: true,
        enumerable: true,
        value: (...sample: [unknown, ...Array<unknown>]) =>
          new CustomMatcher(false, ...sample),
        writable: true,
      });
      Object.defineProperty(expect.not, key, {
        configurable: true,
        enumerable: true,
        value: (...sample: [unknown, ...Array<unknown>]) =>
          new CustomMatcher(true, ...sample),
        writable: true,
      });
    }
  });

  Object.assign((global as any)[JEST_MATCHERS_OBJECT].matchers, matchers);
};
