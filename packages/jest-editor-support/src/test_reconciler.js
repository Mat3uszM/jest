// @flow
'use strict';

import {basename} from 'path';
import type {
  JestTotalResults, 
  JestAssertionResults, 
  TestFileAssertionStatus,
  TestAssertionStatus,
  TestReconcilationState,
} from './types';

/**
 *  You have a Jest test runner watching for changes, and you have
 *  an extension that wants to know where to show errors after file parsing.
 * 
 *  This class represents the state between runs, keeping track of passes/fails
 *  at a file level, generating useful error messages and providing a nice API. 
 */

export class TestReconciler {
  fileStatuses: any;
  fails: TestFileAssertionStatus[];
  passes: TestFileAssertionStatus[];

  constructor() {
    this.fileStatuses = {}; 
  }

  updateFileWithJestStatus(results: JestTotalResults) {
    this.fails = [];
    this.passes = [];

    // Loop through all files inside the report from Jest
    results.testResults.forEach(file => {
      // Did the file pass/fail?
      const status = this.statusToReconcilationState(file.status);
      // Create our own simpler representation 
      const fileStatus: TestFileAssertionStatus = {
        assertions: this.mapAssertions(file.name, file.assertionResults),
        file: file.name,
        message: file.message,
        status,
      };
      this.fileStatuses[file.name] = fileStatus; 

      if (status === 'KnownFail') {
        this.fails.push(fileStatus);
      } else if (status === 'KnownSuccess') { 
        this.passes.push(fileStatus);
      }
    });
  }

  failedStatuses(): TestFileAssertionStatus[] {
    return this.fails || [];
  }

  passedStatuses(): TestFileAssertionStatus[] {
    return this.passes || [];
  }

  // A failed test also contains the stack trace for an `expect`
  // we don't get this as structured data, but what we get 
  // is useful enough to make it for ourselves

  mapAssertions(
    filename:string, assertions: JestAssertionResults[],
    ): TestAssertionStatus[] {
    // Is it jest < 17? e.g. Before I added this to the JSON
    if (!assertions) { return []; }
    
    // Change all failing assertions into structured data 
    return assertions.map(assertion => {
      // Failure messages seems to always be an array of one item
      const message = assertion.failureMessages[0];
      let short = null;
      let terse = null;
      let line = null;
      if (message) {
        // Just the first line, with little whitespace
        short = message.split('   at', 1)[0].trim();
        // this will show inline, so we want to show very little 
        terse = this.sanitizeShortErrorMessage(short);
        line = this.lineOfError(message, filename);
      }
      return {
        line,
        message,
        shortMessage: short,
        status: this.statusToReconcilationState(assertion.status),
        terseMessage: terse,
        title: assertion.title,
      };
    });
  }

  // Do everything we can to try make a one-liner from the error report 
  sanitizeShortErrorMessage(string: string): string {
    return string.split('\n')
                .splice(2)
                .join('')
                .replace('  ', ' ')
                .replace(/\[\d\dm/g, '')
                .replace('Received:', ' Received:')
                .replace('Difference:', ' Difference:');
  }

  // Pull the line out from the stack trace
  lineOfError(string: string, filename: string): ?number {
    return parseInt(string.split(basename(filename), 2)[1].split(':')[1], 1);
  }

  statusToReconcilationState(status: string): TestReconcilationState {
    switch (status) {
      case 'passed': return 'KnownSuccess';
      case 'failed': return 'KnownFail';
      default: return 'Unknown';
    }
  }

  stateForTestFile(file:string): TestReconcilationState {
    const results: TestFileAssertionStatus = this.fileStatuses[file];
    if (!results) { return 'Unknown'; }
    return results.status; 
  }

  stateForTestAssertion(file:string, name:string): TestAssertionStatus | null {
    const results: TestFileAssertionStatus = this.fileStatuses[file];
    if (!results) { return null; }
    const assertion = results.assertions.find(a => a.title === name);
    if (!assertion) { return null; }
    return assertion; 
  }
}
