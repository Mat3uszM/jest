/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
'use strict';

import {spawnSync} from 'child_process';
import {skipSuiteOnWindows} from '../../../../scripts/ConditionalTest';

const JEST_RUNTIME = require.resolve('../../bin/jest-repl.js');

describe('Repl', () => {
  skipSuiteOnWindows();

  describe('cli', () => {
    it('runs without errors', () => {
      const output = spawnSync(JEST_RUNTIME, [], {
        cwd: process.cwd(),
        encoding: 'utf8',
        env: process.env,
      });
      expect(output.stderr.trim()).toBe('');
      expect(output.stdout.trim()).toMatch(/›/);
    });
  });
});
