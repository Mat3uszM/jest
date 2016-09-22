/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

import type {Path} from 'types/Config';

const {
  saveSnapshotFile,
  fileExists,
  getSnapshotData,
  getSnapshotPath,
  keyToTestName,
  serialize,
  testNameToKey,
  unescape,
} = require('./utils');
const fs = require('fs');

class SnapshotState {
  _counters: Map<string, number>;
  _index: number;
  _snapshotPath: Path;
  _dirty: boolean;
  _snapshotData: {[key: string]: string};
  _uncheckedKeys: Set<string>;
  added: number;
  failedTests: Set<string>;
  matched: number;
  skippedTests: Set<string>;
  unmatched: number;
  update: boolean;
  updated: number;

  constructor(
    testPath: Path,
    update: boolean,
    snapshotPath?: string,
  ) {
    this._dirty = false;
    this._snapshotPath = snapshotPath || getSnapshotPath(testPath);
    this._snapshotData = getSnapshotData(this._snapshotPath);
    this._uncheckedKeys = new Set(Object.keys(this._snapshotData));
    this._counters = new Map();
    this._index = 0;
    this.added = 0;
    this.matched = 0;
    this.unmatched = 0;
    this.update = update;
    this.updated = 0;
    this.skippedTests = new Set();
    this.failedTests = new Set();
  }

  markSnapshotsAsCheckedForTest(testName: string) {
    this._uncheckedKeys.forEach(uncheckedKey => {
      if (keyToTestName(uncheckedKey) === testName) {
        this._uncheckedKeys.delete(uncheckedKey);
      }
    });
  }

  _addSnapshot(key: string, receivedSerialized: string) {
    this._dirty = true;
    this._snapshotData[key] = receivedSerialized;
  }

  save(update: boolean) {
    const status = {
      deleted: false,
      saved: false,
    };

    const isEmpty = Object.keys(this._snapshotData).length === 0;

    if ((this._dirty || this._uncheckedKeys.size) && !isEmpty) {
      saveSnapshotFile(this._snapshotData, this._snapshotPath);
      status.saved = true;
    } else if (isEmpty && fileExists(this._snapshotPath)) {
      if (update) {
        fs.unlinkSync(this._snapshotPath);
      }
      status.deleted = true;
    }

    return status;
  }

  getUncheckedCount(): number {
    return this._uncheckedKeys.size || 0;
  }

  removeUncheckedKeys(): void {
    if (this._uncheckedKeys.size) {
      this._dirty = true;
      this._uncheckedKeys.forEach(key => delete this._snapshotData[key]);
      this._uncheckedKeys.clear();
    }
  }

  match(testName: string, received: any, key?: string) {
    this._counters.set(testName, (this._counters.get(testName) || 0) + 1);
    const count = Number(this._counters.get(testName));

    if (!key) {
      key = testNameToKey(testName, count);
    }

    this._uncheckedKeys.delete(key);

    const receivedSerialized = serialize(received);
    const receivedUnescaped = unescape(receivedSerialized);
    const expected = this._snapshotData[key];
    const pass = expected === receivedUnescaped;
    const hasSnapshot = this._snapshotData[key] !== undefined;

    if (pass) {
      // Executing a snapshot file as JavaScript and writing the strings back
      // when other snapshots have changed loses the proper escaping for some
      // characters. Since we check every snapshot in every test, use the newly
      // generated formatted string.
      // Note that this is only relevant when a snapshot is added and the dirty
      // flag is set.
      this._snapshotData[key] = receivedSerialized;
    }

    if (
      !fileExists(this._snapshotPath) || // there's no snapshot file
      (hasSnapshot && this.update) || // there is a file, but we're updating
      !hasSnapshot // there is a file, but it doesn't have this snaphsot
    ) {
      if (this.update) {
        if (!pass) {
          if (hasSnapshot) {
            this.updated++;
          } else {
            this.added++;
          }
          this._addSnapshot(key, receivedSerialized);
        } else {
          this.matched++;
        }
      } else {
        this._addSnapshot(key, receivedSerialized);
        this.added++;
      }

      return {pass: true};
    } else {
      if (!pass) {
        this.unmatched++;
        return {
          count,
          pass: false,
          expected,
          actual: receivedUnescaped,
        };
      } else {
        this.matched++;
        return {pass: true};
      }
    }
  }
}

module.exports = SnapshotState;
