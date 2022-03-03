/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {Config} from '@jest/types';
import {constants} from 'jest-config';
import {buildArgv} from '../../cli';
import {check} from '../../cli/args';

const argv = (input: Partial<Config.Argv>): Config.Argv => input as Config.Argv;

describe('check', () => {
  it('returns true if the arguments are valid', () => {
    expect(check(argv({}))).toBe(true);
  });

  it('raises an exception if runInBand and maxWorkers are both specified', () => {
    expect(() => check(argv({maxWorkers: 2, runInBand: true}))).toThrow(
      'Both --runInBand and --maxWorkers were specified',
    );
  });

  it('raises an exception if onlyChanged and watchAll are both specified', () => {
    expect(() => check(argv({onlyChanged: true, watchAll: true}))).toThrow(
      'Both --onlyChanged and --watchAll were specified',
    );
  });

  it('raises an exception if onlyFailures and watchAll are both specified', () => {
    expect(() => check(argv({onlyFailures: true, watchAll: true}))).toThrow(
      'Both --onlyFailures and --watchAll were specified',
    );
  });

  it('raises an exception when lastCommit and watchAll are both specified', () => {
    expect(() => check(argv({lastCommit: true, watchAll: true}))).toThrow(
      'Both --lastCommit and --watchAll were specified',
    );
  });

  it('raises an exception if findRelatedTests is specified with no file paths', () => {
    expect(() =>
      check(
        argv({
          _: [],
          findRelatedTests: true,
        }),
      ),
    ).toThrow(
      'The --findRelatedTests option requires file paths to be specified',
    );
  });

  it('raises an exception if maxWorkers is specified with no number', () => {
    expect(() => check(argv({maxWorkers: undefined}))).toThrow(
      'The --maxWorkers (-w) option requires a number or string to be specified',
    );
  });

  it('allows maxWorkers to be a %', () => {
    expect(() => check(argv({maxWorkers: '50%'}))).not.toThrow();
  });

  test.each(constants.JEST_CONFIG_EXT_ORDER.map(e => e.substring(1)))(
    'allows using "%s" file for --config option',
    ext => {
      expect(() => check(argv({config: `jest.config.${ext}`}))).not.toThrow();
      expect(() =>
        check(argv({config: `../test/test/my_conf.${ext}`})),
      ).not.toThrow();
    },
  );

  it('raises an exception if selectProjects is not provided any project names', () => {
    expect(() => check(argv({selectProjects: []}))).toThrow(
      'The --selectProjects option requires the name of at least one project to be specified.\n',
    );
  });

  it('raises an exception if config is not a valid JSON string', () => {
    expect(() => check(argv({config: 'x:1'}))).toThrow(
      'The --config option requires a JSON string literal, or a file path with one of these extensions: .js, .ts, .mjs, .cjs, .json',
    );
  });

  it('raises an exception if config is not a supported file type', () => {
    const message =
      'The --config option requires a JSON string literal, or a file path with one of these extensions: .js, .ts, .mjs, .cjs, .json';

    expect(() => check(argv({config: 'jest.configjs'}))).toThrow(message);
    expect(() => check(argv({config: 'jest.config.exe'}))).toThrow(message);
  });

  it('raises an exception if shard has wrong format', () => {
    expect(() => check(argv({shard: 'mumblemuble'}))).toThrow(
      /string in the format of <n>\/<m>/,
    );
  });

  it('raises an exception if shard pair has to many items', () => {
    expect(() => check(argv({shard: '1/2/2'}))).toThrow(
      /string in the format of <n>\/<m>/,
    );
  });

  it('raises an exception if shard has floating points', () => {
    expect(() => check(argv({shard: '1.0/1'}))).toThrow(
      /string in the format of <n>\/<m>/,
    );
  });

  it('raises an exception if first item in shard pair is no number', () => {
    expect(() => check(argv({shard: 'a/1'}))).toThrow(
      /string in the format of <n>\/<m>/,
    );
  });

  it('raises an exception if second item in shard pair is no number', () => {
    expect(() => check(argv({shard: '1/a'}))).toThrow(
      /string in the format of <n>\/<m>/,
    );
  });

  it('raises an exception if shard is zero-indexed', () => {
    expect(() => check(argv({shard: '0/1'}))).toThrow(
      /requires 1-based values, received 0/,
    );
  });

  it('raises an exception if shard index is larger than shard count', () => {
    expect(() => check(argv({shard: '2/1'}))).toThrow(
      /requires <n> to be lower or equal than <m>/,
    );
  });

  it('allows valid shard format', () => {
    expect(() => check(argv({shard: '1/2'}))).not.toThrow();
  });
});

describe('buildArgv', () => {
  it('should return only camelcased args ', async () => {
    const mockProcessArgv = jest
      // @ts-expect-error
      .spyOn(process.argv, 'slice')
      .mockImplementation(() => ['--clear-mocks']);

    const actual = await buildArgv();
    expect(actual).not.toHaveProperty('clear-mocks');
    expect(actual).toHaveProperty('clearMocks', true);
    mockProcessArgv.mockRestore();
  });
});
