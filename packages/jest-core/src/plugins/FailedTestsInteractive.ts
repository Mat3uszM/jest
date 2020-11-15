import type {AggregatedResult, AssertionLocation} from '@jest/test-result';
import type {Config} from '@jest/types';
import {
  BaseWatchPlugin,
  JestHookSubscriber,
  UpdateConfigCallback,
  UsageData,
} from 'jest-watcher';
import FailedTestsInteractiveMode from '../FailedTestsInteractiveMode';

export default class FailedTestsInteractivePlugin extends BaseWatchPlugin {
  private _failedTestAssertions?: Array<AssertionLocation>;
  private readonly _manager = new FailedTestsInteractiveMode(this._stdout);

  apply(hooks: JestHookSubscriber): void {
    hooks.onTestRunComplete(results => {
      this._failedTestAssertions = this.getFailedSnapshotTestAssertions(
        results,
      );

      if (this._manager.isActive()) this._manager.updateWithResults(results);
    });
  }

  getUsageInfo(): UsageData | null {
    if (this._failedTestAssertions?.length) {
      return {key: 'i', prompt: 'run failing tests interactively'};
    }

    return null;
  }

  onKey(key: string): void {
    if (this._manager.isActive()) {
      this._manager.put(key);
    }
  }

  run(
    _: Config.GlobalConfig,
    updateConfigAndRun: UpdateConfigCallback,
  ): Promise<void> {
    return new Promise(resolve => {
      if (!this._failedTestAssertions?.length) return resolve();

      this._manager.run(this._failedTestAssertions, failure => {
        updateConfigAndRun({
          mode: 'watch',
          testNamePattern: failure ? `^${failure.fullName}$` : '',
          testPathPattern: failure?.path || '',
        });

        if (!this._manager.isActive()) resolve();
      });
    });
  }

  private getFailedSnapshotTestAssertions(
    results: AggregatedResult,
  ): Array<AssertionLocation> {
    const failedTestPaths: Array<AssertionLocation> = [];

    if (
      // skip if no failed tests
      results.numFailedTests === 0 ||
      // skip if missing test results
      !results.testResults ||
      // skip if unmatched snapshots are present
      results.snapshot.unmatched
    ) {
      return failedTestPaths;
    }

    results.testResults.forEach(testResult => {
      testResult.testResults.forEach(result => {
        if (result.status === 'failed') {
          failedTestPaths.push({
            fullName: result.fullName,
            path: testResult.testFilePath,
          });
        }
      });
    });

    return failedTestPaths;
  }
}
