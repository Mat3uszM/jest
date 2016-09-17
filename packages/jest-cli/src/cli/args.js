/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const check = (argv: Object) => {
  if (argv.runInBand && argv.hasOwnProperty('maxWorkers')) {
    throw new Error(
      'Both --runInBand and --maxWorkers were specified, but these two ' +
      'options do not make sense together. Which is it?',
    );
  }

  if (argv.onlyChanged && argv._.length > 0) {
    throw new Error(
      'Both --onlyChanged and a path pattern were specified, but these ' +
      'two options do not make sense together. Which is it? Do you want ' +
      'to run tests for changed files? Or for a specific set of files?',
    );
  }

  if (argv.onlyChanged && argv.watchAll) {
    throw new Error(
      'Both --onlyChanged and --watchAll were specified, but these two ' +
      'options do not make sense together. Try the --watch option which ' +
      'reruns only tests related to changed files.',
    );
  }

  return true;
};

const usage = 'Usage: $0 [--config=<pathToConfigFile>] [TestPathPattern]';

const options = {
  config: {
    alias: 'c',
    description:
      'The path to a jest config file specifying how to find and execute ' +
      'tests. If no rootDir is set in the config, the current directory ' +
      'is assumed to be the rootDir for the project. This can also be a JSON' +
      'encoded value which Jest will use as configuration.',
    type: 'string',
  },
  coverage: {
    description:
      'Indicates that test coverage information should be collected and ' +
      'reported in the output.',
    type: 'boolean',
  },
  collectCoverageFrom: {
    description:
      'relative to <rootDir> glob pattern matching the files that coverage ' +
      'info needs to be collected from.',
    type: 'string',
  },
  debug: {
    description: 'Print debugging info about your jest config.',
    type: 'boolean',
  },
  maxWorkers: {
    alias: 'w',
    description:
      'Specifies the maximum number of workers the worker-pool will ' +
      'spawn for running tests. This defaults to the number of the cores ' +
      'available on your machine. (its usually best not to override this ' +
      'default)',
    type: 'string', // no, yargs -- its a number.. :(
  },
  onlyChanged: {
    alias: 'o',
    description:
      'Attempts to identify which tests to run based on which files have ' +
      'changed in the current repository. Only works if you\'re running ' +
      'tests in a git repository at the moment.',
    type: 'boolean',
  },
  runInBand: {
    alias: 'i',
    description:
      'Run all tests serially in the current process (rather than ' +
      'creating a worker pool of child processes that run tests). This ' +
      'is sometimes useful for debugging, but such use cases are pretty ' +
      'rare.',
    type: 'boolean',
  },
  testNamePattern: {
    description:
      'Run only tests with a name that matches the regex pattern.',
    type: 'string',
  },
  testPathPattern: {
    description:
      'A regexp pattern string that is matched against all tests ' +
      'paths before executing the test.',
    type: 'string',
  },
  version: {
    alias: 'v',
    description:'Print the version and exit',
    type: 'boolean',
  },
  colors: {
    description:
      'Forces test results output highlighting (even if stdout is not a TTY)',
    type: 'boolean',
  },
  noStackTrace: {
    description: 'Disables stack trace in test results output',
    type: 'boolean',
  },
  verbose: {
    description:
      'Display individual test results with the test suite hierarchy.',
    type: 'boolean',
  },
  notify: {
    description: 'Activates notifications for test results.',
    type: 'boolean',
  },
  watch: {
    description:
      'Watch files for changes and rerun tests related to changed files. ' +
      'If you want to re-run all tests when a file has changed, use the ' +
      '`--watchAll` option.',
    type: 'boolean',
  },
  watchAll: {
    description:
      'Watch files for changes and rerun all tests. If you want to re-run ' +
       'only the tests related to the changed files, use the ' +
      '`--watch` option.',
    type: 'boolean',
  },
  bail: {
    alias: 'b',
    description:
      'Exit the test suite immediately upon the first failing test.',
    type: 'boolean',
  },
  useStderr: {
    description: 'Divert all output to stderr.',
    type: 'boolean',
  },
  cache: {
    default: true,
    description:
      'Whether to use the preprocessor cache. Disable the cache using ' +
      '--no-cache.',
    type: 'boolean',
  },
  env: {
    default: undefined,
    description:
      'The test environment used for all tests. This can point to any file ' +
      'or node module. Examples: `jsdom`, `node` or ' +
      '`path/to/my-environment.js`',
    type: 'string',
  },
  json: {
    description:
      'Prints the test results in JSON. This mode will send all ' +
      'other test output and user messages to stderr.',
    type: 'boolean',
  },
  setupTestFrameworkScriptFile: {
    description:
      'The path to a module that runs some code to configure or set up ' +
      'the testing framework before each test.',
    type: 'string',
  },
  testRunner: {
    description:
      'Allows to specify a custom test runner. Jest ships with Jasmine ' +
      '1 and 2 which can be enabled by setting this option to ' +
      '`jasmine1` or `jasmine2`. The default is `jasmine2`. A path to a ' +
      'custom test runner can be provided: ' +
      '`<rootDir>/path/to/testRunner.js`.',
    type: 'string',
  },
  logHeapUsage: {
    description:
      'Logs the heap usage after every test. Useful to debug memory ' +
      'leaks. Use together with `--runInBand` and `--expose-gc` in node.',
    type: 'boolean',
  },
  watchman: {
    default: true,
    description:
      'Whether to use watchman for file crawling. Disable using ' +
      '--no-watchman.',
    type: 'boolean',
  },
  silent: {
    default: false,
    description: 'Prevent tests from printing messages through the console.',
    type: 'boolean',
  },
  updateSnapshot: {
    alias: 'u',
    default: false,
    description: 'Use this flag to re-record snapshots.',
    type: 'boolean',
  },
  testcheckTimes: {
    default: 100,
    description:
      'The number of test cases to generate for each testcheck test. ' +
      'May be overriden for individual test cases using the options ' +
      'argument of check.it.',
    type: 'number',
  },
  testcheckMaxSize: {
    default: 200,
    description:
      'The maximum size of sized types, such as arrays and ints, to be ' +
      'generated for testcheck tests. ' +
      'May be overriden for individual test cases using the options ' +
      'argument of check.it. ' +
      'Generators can also be sized using gen.resize(n, anotherGenerator).',
    type: 'number',
  },
  testcheckSeed: {
    default: undefined,
    description:
      'The seed for generating testcheck test cases. Defaults to random. ' +
      'May be overriden for individual test cases using the options ' +
      'argument of check.it.',
    type: 'number',
  },
  lastCommit: {
    default: false,
    description:
      'Will run all tests affected by file changes in the last commit made.',
    type: 'boolean',
  },
};

module.exports = {
  check,
  options,
  usage,
};
