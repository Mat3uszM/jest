/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');
import stripAnsi = require('strip-ansi');
import type {
  AggregatedResult,
  AssertionResult,
  Test,
  TestContext,
  TestResult,
} from '@jest/test-result';
import type {Config} from '@jest/types';
import {
  formatPath,
  getStackTraceLines,
  getTopFrame,
  separateMessageFromStack,
} from 'jest-message-util';
import BaseReporter from './BaseReporter';

type AnnotationOptions = {
  file?: string;
  line?: number | string;
  message: string;
  title: string;
  type: 'error' | 'warning';
};

const titleSeparator = ' \u203A ';

type PerformanceInfo = {
  end: number;
  runtime: number;
  slow: boolean;
  start: number;
};

type ResultTreeLeaf = {
  name: string;
  passed: boolean;
  duration: number;
  children: Array<never>;
};

type ResultTreeNode = {
  name: string;
  passed: boolean;
  children: Array<ResultTreeNode | ResultTreeLeaf>;
};

type ResultTree = {
  children: Array<ResultTreeLeaf | ResultTreeNode>;
  name: string;
  passed: boolean;
  performanceInfo: PerformanceInfo;
};

export default class GitHubActionsReporter extends BaseReporter {
  static readonly filename = __filename;
  private readonly silent: boolean;

  constructor(
    _globalConfig: Config.GlobalConfig,
    reporterOptions: Record<string, unknown> = {silent: false},
  ) {
    super();
    const silentOption = reporterOptions.silent;
    if (silentOption !== null && silentOption !== undefined) {
      this.silent = silentOption as boolean;
    } else {
      this.silent = false;
    }
  }

  override onTestResult(
    test: Test,
    testResult: TestResult,
    aggregatedResults: AggregatedResult,
  ): void {
    this.generateAnnotations(test, testResult);
    if (this.silent) {
      return;
    }
    this.printFullResult(test.context, testResult);
    if (this.isLastTestSuite(aggregatedResults)) {
      this.log('');
      if (this.printFailedTestLogs(test, aggregatedResults)) {
        this.log('');
      }
    }
  }

  generateAnnotations({context}: Test, {testResults}: TestResult): void {
    testResults.forEach(result => {
      const title = [...result.ancestorTitles, result.title].join(
        titleSeparator,
      );

      result.retryReasons?.forEach((retryReason, index) => {
        this.#createAnnotation({
          ...this.#getMessageDetails(retryReason, context.config),
          title: `RETRY ${index + 1}: ${title}`,
          type: 'warning',
        });
      });

      result.failureMessages.forEach(failureMessage => {
        this.#createAnnotation({
          ...this.#getMessageDetails(failureMessage, context.config),
          title,
          type: 'error',
        });
      });
    });
  }

  #getMessageDetails(failureMessage: string, config: Config.ProjectConfig) {
    const {message, stack} = separateMessageFromStack(failureMessage);

    const stackLines = getStackTraceLines(stack);
    const topFrame = getTopFrame(stackLines);

    const normalizedStackLines = stackLines.map(line =>
      formatPath(line, config),
    );
    const messageText = [message, ...normalizedStackLines].join('\n');

    return {
      file: topFrame?.file,
      line: topFrame?.line,
      message: messageText,
    };
  }

  #createAnnotation({file, line, message, title, type}: AnnotationOptions) {
    message = stripAnsi(
      // copied from: https://github.com/actions/toolkit/blob/main/packages/core/src/command.ts
      message.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A'),
    );

    this.log(
      `\n::${type} file=${file},line=${line},title=${title}::${message}`,
    );
  }

  private isLastTestSuite(results: AggregatedResult): boolean {
    const passedTestSuites = results.numPassedTestSuites;
    const failedTestSuites = results.numFailedTestSuites;
    const totalTestSuites = results.numTotalTestSuites;
    const computedTotal = passedTestSuites + failedTestSuites;
    if (computedTotal < totalTestSuites) {
      return false;
    } else if (computedTotal === totalTestSuites) {
      return true;
    } else {
      throw new Error(
        `Sum(${computedTotal}) of passed (${passedTestSuites}) and failed (${failedTestSuites}) test suites is greater than the total number of test suites (${totalTestSuites}). Please report the bug at https://github.com/facebook/jest/issues`,
      );
    }
  }

  private printFullResult(context: TestContext, results: TestResult): void {
    const rootDir = context.config.rootDir;
    let testDir = results.testFilePath.replace(rootDir, '');
    testDir = testDir.slice(1, testDir.length);
    const resultTree = this.getResultTree(
      results.testResults,
      testDir,
      results.perfStats,
    );
    this.printResultTree(resultTree);
  }

  private arrayEqual(a1: Array<any>, a2: Array<any>): boolean {
    if (a1.length !== a2.length) {
      return false;
    }
    for (let index = 0; index < a1.length; index++) {
      const element = a1[index];
      if (element !== a2[index]) {
        return false;
      }
    }
    return true;
  }

  private arrayChild(a1: Array<any>, a2: Array<any>): boolean {
    if (a1.length - a2.length !== 1) {
      return false;
    }
    for (let index = 0; index < a2.length; index++) {
      const element = a2[index];
      if (element !== a1[index]) {
        return false;
      }
    }
    return true;
  }

  private getResultTree(
    suiteResult: Array<AssertionResult>,
    testPath: string,
    suitePerf: PerformanceInfo,
  ): ResultTree {
    const root: ResultTree = {
      children: [],
      name: testPath,
      passed: true,
      performanceInfo: suitePerf,
    };
    const branches: Array<Array<string>> = [];
    suiteResult.forEach(element => {
      if (element.ancestorTitles.length === 0) {
        let passed = true;
        if (element.status !== 'passed') {
          root.passed = false;
          passed = false;
        }
        if (!element.duration || isNaN(element.duration)) {
          throw new Error('Expected duration to be a number, got NaN');
        }
        root.children.push({
          children: [],
          duration: Math.max(element.duration, 1),
          name: element.title,
          passed,
        });
      } else {
        let alreadyInserted = false;
        for (let index = 0; index < branches.length; index++) {
          if (
            this.arrayEqual(branches[index], element.ancestorTitles.slice(0, 1))
          ) {
            alreadyInserted = true;
            break;
          }
        }
        if (!alreadyInserted) {
          branches.push(element.ancestorTitles.slice(0, 1));
        }
      }
    });
    branches.forEach(element => {
      const newChild = this.getResultChildren(suiteResult, element);
      if (!newChild.passed) {
        root.passed = false;
      }
      root.children.push(newChild);
    });
    return root;
  }

  private getResultChildren(
    suiteResult: Array<AssertionResult>,
    ancestors: Array<string>,
  ): ResultTreeNode {
    const node: ResultTreeNode = {
      children: [],
      name: ancestors[ancestors.length - 1],
      passed: true,
    };
    const branches: Array<Array<string>> = [];
    suiteResult.forEach(element => {
      let passed = true;
      let duration = element.duration;
      if (!duration || isNaN(duration)) {
        duration = 1;
      }
      if (this.arrayEqual(element.ancestorTitles, ancestors)) {
        if (element.status !== 'passed') {
          node.passed = false;
          passed = false;
        }
        node.children.push({
          children: [],
          duration,
          name: element.title,
          passed,
        });
      } else if (
        this.arrayChild(
          element.ancestorTitles.slice(0, ancestors.length + 1),
          ancestors,
        )
      ) {
        let alreadyInserted = false;
        for (let index = 0; index < branches.length; index++) {
          if (
            this.arrayEqual(
              branches[index],
              element.ancestorTitles.slice(0, ancestors.length + 1),
            )
          ) {
            alreadyInserted = true;
            break;
          }
        }
        if (!alreadyInserted) {
          branches.push(element.ancestorTitles.slice(0, ancestors.length + 1));
        }
      }
    });
    branches.forEach(element => {
      const newChild = this.getResultChildren(suiteResult, element);
      if (!newChild.passed) {
        node.passed = false;
      }
      node.children.push(newChild);
    });
    return node;
  }

  private printResultTree(resultTree: ResultTree): void {
    let perfMs;
    if (resultTree.performanceInfo.slow) {
      perfMs = ` (${chalk.red.inverse(
        `${resultTree.performanceInfo.runtime} ms`,
      )})`;
    } else {
      perfMs = ` (${resultTree.performanceInfo.runtime} ms)`;
    }
    if (resultTree.passed) {
      this.startGroup(
        `${chalk.bold.green.inverse('PASS')} ${resultTree.name}${perfMs}`,
      );
      resultTree.children.forEach(child => {
        this.recursivePrintResultTree(child, true, 1);
      });
      this.endGroup();
    } else {
      this.log(
        `  ${chalk.bold.red.inverse('FAIL')} ${resultTree.name}${perfMs}`,
      );
      resultTree.children.forEach(child => {
        this.recursivePrintResultTree(child, false, 1);
      });
    }
  }

  private recursivePrintResultTree(
    resultTree: ResultTreeNode | ResultTreeLeaf,
    alreadyGrouped: boolean,
    depth: number,
  ): void {
    if (resultTree.children.length === 0) {
      if (!('duration' in resultTree)) {
        throw new Error('Expected a leaf. Got a node.');
      }
      let numberSpaces = depth;
      if (!alreadyGrouped) {
        numberSpaces++;
      }
      const spaces = '  '.repeat(numberSpaces);
      let resultSymbol;
      if (resultTree.passed) {
        resultSymbol = chalk.green('\u2713');
      } else {
        resultSymbol = chalk.red('\u00D7');
      }
      this.log(
        `${spaces + resultSymbol} ${resultTree.name} (${
          resultTree.duration
        } ms)`,
      );
    } else {
      if (resultTree.passed) {
        if (alreadyGrouped) {
          this.log('  '.repeat(depth) + resultTree.name);
          resultTree.children.forEach(child => {
            this.recursivePrintResultTree(child, true, depth + 1);
          });
        } else {
          this.startGroup('  '.repeat(depth) + resultTree.name);
          resultTree.children.forEach(child => {
            this.recursivePrintResultTree(child, true, depth + 1);
          });
          this.endGroup();
        }
      } else {
        this.log('  '.repeat(depth + 1) + resultTree.name);
        resultTree.children.forEach(child => {
          this.recursivePrintResultTree(child, false, depth + 1);
        });
      }
    }
  }

  private printFailedTestLogs(
    context: Test,
    testResults: AggregatedResult,
  ): boolean {
    const rootDir = context.context.config.rootDir;
    const results = testResults.testResults;
    let written = false;
    results.forEach(result => {
      let testDir = result.testFilePath;
      testDir = testDir.replace(rootDir, '');
      testDir = testDir.slice(1, testDir.length);
      if (result.failureMessage) {
        written = true;
        this.startGroup(`Errors thrown in ${testDir}`);
        this.log(result.failureMessage);
        this.endGroup();
      }
    });
    return written;
  }

  private startGroup(title: string): void {
    this.log(`::group::${title}`);
  }

  private endGroup(): void {
    this.log('::endgroup::');
  }
}
