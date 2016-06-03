/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

require('jest-haste-map').fastpath.replace();

const realFs = require('fs');
const fs = require('graceful-fs');
fs.gracefulify(realFs);

const TestRunner = require('./TestRunner');
const SearchSource = require('./SearchSource');

const buildHasteMap = require('./lib/buildHasteMap');
const chalk = require('chalk');
const constants = require('./constants');
const formatTestResults = require('./lib/formatTestResults');
const os = require('os');
const path = require('path');
const readConfig = require('./config/read');
const sane = require('sane');
const which = require('which');

const CLEAR = '\x1B[2J\x1B[H';
const WATCHER_DEBOUNCE = 200;
const WATCHMAN_BIN = 'watchman';

function getMaxWorkers(argv) {
  if (argv.runInBand) {
    return 1;
  } else if (argv.maxWorkers) {
    return argv.maxWorkers;
  } else {
    const cpus = os.cpus().length;
    return Math.max(argv.watch ? Math.floor(cpus / 2) : cpus - 1, 1);
  }
}

function buildTestPathPatternInfo(argv) {
  if (argv.onlyChanged) {
    return {
      onlyChanged: true,
      watch: argv.watch !== undefined,
    };
  }
  if (argv.testPathPattern) {
    return {
      input: argv.testPathPattern,
      testPathPattern: argv.testPathPattern,
      shouldTreatInputAsPattern: true,
    };
  }
  if (argv._ && argv._.length) {
    return {
      input: argv._.join(' '),
      testPathPattern: argv._.join('|'),
      shouldTreatInputAsPattern: false,
    };
  }
  return {
    input: '',
    testPathPattern: '',
    shouldTreatInputAsPattern: false,
  };
}

function pluralize(word, count, ending) {
  return `${count} ${word}${count === 1 ? '' : ending}`;
}

function getNoTestsFoundMessage(patternInfo, config, data) {
  if (patternInfo.onlyChanged) {
    const guide = patternInfo.watch
      ? 'starting Jest with `jest --watch=all`'
      : 'running Jest without `-o`';
    return 'No tests found related to changed and uncommitted files.\n' +
    'Note: If you are using dynamic `require`-calls or no tests related ' +
    'to your changed files can be found, consider ' + guide + '.';
  }

  const pattern = patternInfo.testPathPattern;
  const input = patternInfo.input;
  const shouldTreatInputAsPattern = patternInfo.shouldTreatInputAsPattern;

  const formattedPattern = `/${pattern}/`;
  const formattedInput = shouldTreatInputAsPattern
    ? `/${input}/`
    : `"${input}"`;
  const testPathPattern = input === pattern ? formattedInput : formattedPattern;

  const statsMessage = Object.keys(data.stats).map(key => {
    const value = key === 'testPathPattern' ? testPathPattern : config[key];
    if (value) {
      const matches = pluralize('match', data.stats[key], 'es');
      return `  ${key}: ${chalk.yellow(value)} - ${matches}`;
    }
    return null;
  }).filter(line => line).join('\n');

  return `${chalk.bold.red('NO TESTS FOUND')}. ` +
    `${pluralize('file', data.total, 's')} checked.\n${statsMessage}`;
}

function getWatcher(config, packageRoot, callback) {
  which(WATCHMAN_BIN, (err, resolvedPath) => {
    const watchman = !err && resolvedPath;
    const glob = config.moduleFileExtensions.map(ext => '**/*' + ext);
    const watcher = sane(packageRoot, {glob, watchman});
    callback(watcher);
  });
}

function runJest(config, argv, pipe, onComplete) {
  if (argv.silent) {
    config.silent = true;
  }
  const patternInfo = buildTestPathPatternInfo(argv);
  const maxWorkers = getMaxWorkers(argv);
  const hasteMap = buildHasteMap(config, maxWorkers);

  const source = new SearchSource(hasteMap, config);
  return source.getTestPaths(patternInfo)
    .then(data => {
      if (!data.paths.length) {
        pipe.write(`${getNoTestsFoundMessage(patternInfo, config, data)}\n`);
      }
      return data.paths;
    })
    .then(testPaths => {
      const testRunner = new TestRunner(hasteMap, config, {maxWorkers});
      return testRunner.runTests(testPaths);
    })
    .then(runResults => {
      if (config.testResultsProcessor) {
        const processor = require(config.testResultsProcessor);
        processor(runResults);
      }
      if (argv.json) {
        process.stdout.write(
          JSON.stringify(formatTestResults(runResults, config))
        );
      }
      return runResults;
    })
    .then(runResults => onComplete && onComplete(runResults.success))
    .catch(error => {
      if (error.type == 'DependencyGraphError') {
        throw new Error([
          '\nError: ' + error.message + '\n\n',
          'This is most likely a setup ',
          'or configuration issue. To resolve a module name collision, ',
          'change or blacklist one of the offending modules. See ',
          'http://facebook.github.io/jest/docs/api.html#modulepathignorepatterns-array-string',
        ].join(''));
      } else {
        throw error;
      }
    });
}

function runCLI(argv, root, onComplete) {
  const pipe = argv.json ? process.stderr : process.stdout;

  argv = argv || {};
  if (argv.version) {
    pipe.write(`v${constants.VERSION}\n`);
    onComplete && onComplete(true);
    return;
  }

  readConfig(argv, root)
    .then(config => {
      // Disable colorization
      if (config.noHighlight) {
        chalk.enabled = false;
      }

      const testFramework = require(config.testRunner);
      const info = [`v${constants.VERSION}`, testFramework.name];
      if (config.usesBabelJest) {
        info.push('babel-jest');
      }

      const prefix = argv.watch ? 'Watch using' : 'Using';
      const header = `${prefix} Jest CLI ${info.join(', ')}\n`;
      if (argv.watch !== undefined) {
        if (argv.watch !== 'all') {
          argv.onlyChanged = true;
        }

        getWatcher(config, root, watcher => {
          let timer;
          let isRunning;

          pipe.write(CLEAR + header);
          watcher.on('all', (_, filePath) => {
            pipe.write(CLEAR + header);
            filePath = path.join(root, filePath);
            const isValidPath =
              config.testPathDirs.some(dir => filePath.startsWith(dir));
            if (!isRunning && isValidPath) {
              if (timer) {
                clearTimeout(timer);
                timer = null;
              }
              timer = setTimeout(
                () => {
                  isRunning = true;
                  runJest(config, argv, pipe, () => isRunning = false);
                },
                WATCHER_DEBOUNCE
              );
            }
          });
        });
      } else {
        pipe.write(header);
        runJest(config, argv, pipe, onComplete);
      }
    })
    .catch(error => {
      console.error(error.stack);
      process.exit(1);
    });
}

module.exports = {
  TestRunner,
  getVersion: () => constants.VERSION,
  runCLI,
};
