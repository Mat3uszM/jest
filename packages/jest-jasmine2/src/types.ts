/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {AssertionError} from 'assert';
import {Config} from '@jest/types';
import expect from 'expect';
import Spec from './jasmine/Spec';
import JsApiReporter from './jasmine/JsApiReporter';
import Jasmine2Reporter from './reporter';
import Timer from './jasmine/Timer';
import Env from './jasmine/Env';
import createSpy from './jasmine/createSpy';
import ReportDispatcher from './jasmine/ReportDispatcher';
import SpyRegistry from './jasmine/spyRegistry';
import Suite from './jasmine/Suite';

export interface AssertionErrorWithStack extends AssertionError {
  stack: string;
}

// TODO Add expect types to @jest/types or leave it here
// Borrowed from "expect"
// -------START-------
export type SyncExpectationResult = {
  pass: boolean;
  message: () => string;
};

export type AsyncExpectationResult = Promise<SyncExpectationResult>;

export type ExpectationResult = SyncExpectationResult | AsyncExpectationResult;

export type RawMatcherFn = (
  expected: any,
  actual: any,
  options?: any,
) => ExpectationResult;
// -------END-------

export type Reporter = JsApiReporter | Jasmine2Reporter;
export type Jasmine = {
  Spec: typeof Spec;
  JsApiReporter: typeof JsApiReporter;
  Timer: typeof Timer;
} & typeof expect;

export interface $J extends NodeJS.Global {
  _DEFAULT_TIMEOUT_INTERVAL: number;
  currentEnv_: ReturnType<typeof Env>['prototype'];
  getEnv: (options: object) => ReturnType<typeof Env>['prototype'];
  createSpy: typeof createSpy;
  Env: ReturnType<typeof Env>;
  JsApiReporter: typeof JsApiReporter;
  ReportDispatcher: typeof ReportDispatcher;
  Spec: typeof Spec;
  SpyRegistry: typeof SpyRegistry;
  Suite: typeof Suite;
  Timer: typeof Timer;
  version: string;
  testPath: Config.Path;
}

interface Global {
  jasmine: Jasmine;
}

declare global {
  module NodeJS {
    interface Global {
      jasmine: Jasmine;
    }
  }
}
