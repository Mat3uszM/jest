/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = config => {
  config.set({
    browsers: ['ChromeHeadless'],
    files: ['integration-tests/browser-support/browser-test.js'],
    frameworks: ['mocha', 'browserify'],
    preprocessors: {
      'integration-tests/browser-support/browser-test.js': ['browserify'],
    },
  });
};
