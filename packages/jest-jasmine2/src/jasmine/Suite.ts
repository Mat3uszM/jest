/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
// This file is a heavily modified fork of Jasmine. Original license:
/*
Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/* eslint-disable local/ban-types-eventually, sort-keys, local/prefer-spread-eventually, local/prefer-rest-params-eventually */

import type {Config} from '@jest/types';
import {convertDescriptorToString} from 'jest-util';
import ExpectationFailed from '../ExpectationFailed';
import expectationResultFactory from '../expectationResultFactory';
import type {QueueableFn} from '../queueRunner';
import type Spec from './Spec';

export type SuiteResult = {
  id: string;
  description: string;
  fullName: string;
  failedExpectations: Array<ReturnType<typeof expectationResultFactory>>;
  testPath: Config.Path;
  status?: string;
};

export type Attributes = {
  id: string;
  parentSuite?: Suite;
  description: string;
  throwOnExpectationFailure?: boolean;
  getTestPath: () => Config.Path;
};

export default class Suite {
  id: string;
  parentSuite?: Suite;
  description: string;
  throwOnExpectationFailure: boolean;
  beforeFns: Array<QueueableFn>;
  afterFns: Array<QueueableFn>;
  beforeAllFns: Array<QueueableFn>;
  afterAllFns: Array<QueueableFn>;
  disabled: boolean;
  children: Array<Suite | Spec>;
  result: SuiteResult;
  sharedContext?: object;
  markedPending: boolean;
  markedTodo: boolean;
  isFocused: boolean;

  constructor(attrs: Attributes) {
    this.markedPending = false;
    this.markedTodo = false;
    this.isFocused = false;
    this.id = attrs.id;
    this.parentSuite = attrs.parentSuite;
    this.description = convertDescriptorToString(attrs.description);
    this.throwOnExpectationFailure = !!attrs.throwOnExpectationFailure;

    this.beforeFns = [];
    this.afterFns = [];
    this.beforeAllFns = [];
    this.afterAllFns = [];
    this.disabled = false;

    this.children = [];

    this.result = {
      id: this.id,
      description: this.description,
      fullName: this.getFullName(),
      failedExpectations: [],
      testPath: attrs.getTestPath(),
    };
  }
  getFullName(): string {
    const fullName = [];
    for (
      let parentSuite: Suite | undefined = this;
      parentSuite;
      parentSuite = parentSuite.parentSuite
    ) {
      if (parentSuite.parentSuite) {
        fullName.unshift(parentSuite.description);
      }
    }
    return fullName.join(' ');
  }
  disable(): void {
    this.disabled = true;
  }
  pend(_message?: string): void {
    this.markedPending = true;
  }
  beforeEach(fn: QueueableFn): void {
    this.beforeFns.unshift(fn);
  }
  beforeAll(fn: QueueableFn): void{
    this.beforeAllFns.push(fn);
  }
  afterEach(fn: QueueableFn): void {
    this.afterFns.unshift(fn);
  }
  afterAll(fn: QueueableFn): void {
    this.afterAllFns.unshift(fn);
  }

  addChild(child: Suite | Spec): void {
    this.children.push(child);
  }

  status(): string | string | string | string   {
    if (this.disabled) {
      return 'disabled';
    }

    if (this.markedPending) {
      return 'pending';
    }

    if (this.result.failedExpectations.length > 0) {
      return 'failed';
    } else {
      return 'finished';
    }
  }

  isExecutable(): boolean {
    return !this.disabled;
  }

  canBeReentered(): boolean {
    return this.beforeAllFns.length === 0 && this.afterAllFns.length === 0;
  }

  getResult(): SuiteResult {
    this.result.status! = this.status();
    return this.result;
  }

  sharedUserContext(): object {
    if (!this.sharedContext) {
      this.sharedContext = {};
    }

    return this.sharedContext;
  }

  clonedSharedUserContext(): object {
    return this.sharedUserContext();
  }

  onException(...args: Parameters<Spec['onException']>): void{
    if (args[0] instanceof ExpectationFailed) {
      return;
    }

    if (isAfterAll(this.children)) {
      const data = {
        matcherName: '',
        passed: false,
        expected: '',
        actual: '',
        error: arguments[0],
      };
      this.result.failedExpectations.push(expectationResultFactory(data));
    } else {
      for (let i = 0; i < this.children.length; i++) {
        const child = this.children[i];
        child.onException.apply(child, args);
      }
    }
  }

  addExpectationResult(...args: Parameters<Spec['addExpectationResult']>):void {
    if (isAfterAll(this.children) && isFailure(args)) {
      const data = args[1];
      this.result.failedExpectations.push(expectationResultFactory(data));
      if (this.throwOnExpectationFailure) {
        throw new ExpectationFailed();
      }
    } else {
      for (let i = 0; i < this.children.length; i++) {
        const child = this.children[i];
        try {
          child.addExpectationResult.apply(child, args);
        } catch {
          // keep going
        }
      }
    }
  }

  execute(..._args: Array<any>): void {}
}

function isAfterAll(children: Array<Spec | Suite>) {
  return children && children[0] && children[0].result.status;
}

function isFailure(args: Array<unknown>) {
  return !args[0];
}
