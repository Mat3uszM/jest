/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');
import {ansiEscapes} from 'jest-util';
import type Prompt from './lib/Prompt';
import type {ScrollOptions} from './types';

const usage = (entity: string) =>
  `\n${chalk.bold('Pattern Mode Usage')}\n` +
  ` ${chalk.dim('\u203A Press')} Esc ${chalk.dim('to exit pattern mode.')}\n` +
  ` ${chalk.dim('\u203A Press')} Enter ` +
  `${chalk.dim(`to filter by a ${entity} regex pattern.`)}\n` +
  '\n';

const usageRows = usage('').split('\n').length;

export default abstract class PatternPrompt {
  protected _currentUsageRows: number;

  constructor(
    protected _pipe: NodeJS.WritableStream,
    protected _prompt: Prompt,
    protected _entityName = '',
  ) {
    this._currentUsageRows = usageRows;
  }

  run(
    onSuccess: (value: string) => void,
    onCancel: () => void,
    options?: {header: string},
  ): void {
    this._pipe.write(ansiEscapes.hideCursor);
    this._pipe.write(ansiEscapes.clearTerminal);

    if (options && options.header) {
      this._pipe.write(`${options.header}\n`);
      this._currentUsageRows = usageRows + options.header.split('\n').length;
    } else {
      this._currentUsageRows = usageRows;
    }

    this._pipe.write(usage(this._entityName));
    this._pipe.write(ansiEscapes.showCursor);

    this._prompt.enter(this._onChange.bind(this), onSuccess, onCancel);
  }

  protected _onChange(_pattern: string, _options: ScrollOptions): void {
    this._pipe.write(ansiEscapes.eraseLine);
    this._pipe.write(ansiEscapes.cursorToFirstColumn);
  }
}
