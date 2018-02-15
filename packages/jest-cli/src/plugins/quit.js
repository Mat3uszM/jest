/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import BaseWatchPlugin from '../base_watch_plugin';

class QuitPlugin extends BaseWatchPlugin {
  async runInteractive() {
    if (typeof this._stdin.setRawMode === 'function') {
      this._stdin.setRawMode(false);
    }
    this._stdout.write('\n');
    process.exit(0);
  }

  getUsageData() {
    return {
      key: 'q'.codePointAt(0),
      prompt: 'quit watch mode',
    };
  }
}

export default QuitPlugin;
