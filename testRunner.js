/* jshint node: true */
"use strict";

var optimist = require('optimist');
var path = require('path');
var TestRunner = require('./src/TestRunner');
var utils = require('./src/lib/utils');

var CONFIG_FILE_PATH = path.resolve(__dirname, './testConfig.json');

utils.loadConfigFromFile(CONFIG_FILE_PATH).done(function(config) {
  var argv = optimist.argv;
  var pathPattern =
    argv.all || argv._.length === 0
    ? /.*/
    : new RegExp(argv._.join('|'));

  new TestRunner(config).run(pathPattern);
});
