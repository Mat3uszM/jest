/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {GlobalConfig} from 'types/Config';
import WatchPlugin from '../watch_plugin';
import type {JestHookSubscriber} from '../jest_hooks';

class UpdateSnapshotsPlugin extends WatchPlugin {
  _hasSnapshotFailure: boolean;
  showPrompt(
    globalConfig: GlobalConfig,
    updateConfigAndRun: Function,
  ): Promise<boolean> {
    updateConfigAndRun({updateSnapshot: 'all'});
    return Promise.resolve(false);
  }

  registerHooks(hooks: JestHookSubscriber) {
    hooks.testRunComplete(results => {
      this._hasSnapshotFailure = results.snapshot.failure;
    });
  }

  getUsageRow(globalConfig: GlobalConfig) {
    return {
      hide: !this._hasSnapshotFailure,
      key: 'u'.codePointAt(0),
      prompt: 'update failing snapshots',
    };
  }
}

export default UpdateSnapshotsPlugin;
