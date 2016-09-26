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

export type LogMessage = string;
export type LogEntry = {|
  message: LogMessage,
  origin: string,
  type: LogType,
|};
export type LogType = 'log' | 'info' | 'warn' | 'error';
export type ConsoleBuffer = Array<LogEntry>;
