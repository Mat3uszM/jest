/*
Copyright (c) 2008-2016 Pivotal Labs

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
/* eslint-disable sort-keys */
'use strict';

const buildExpectationResult = require('./buildExpectationResult');
const createSpy = require('./createSpy');
const Env = require('./Env');
const ExceptionFormatter = require('./ExceptionFormatter');
const JsApiReporter = require('./JsApiReporter');
const QueueRunner = require('./QueueRunner');
const ReportDispatcher = require('./ReportDispatcher');
const Spec = require('./Spec');
const SpyRegistry = require('./SpyRegistry');
const SpyStrategy = require('./SpyStrategy');
const Suite = require('./Suite');
const Timer = require('./Timer');
const TreeProcessor = require('./TreeProcessor');

exports.create = function() {
  const j$ = {};

  j$.DEFAULT_TIMEOUT_INTERVAL = 5000;

  j$.getEnv = function(options) {
    const env = (j$.currentEnv_ = j$.currentEnv_ || new j$.Env(options));
    //jasmine. singletons in here (setTimeout blah blah).
    return env;
  };
  j$.buildExpectationResult = buildExpectationResult;
  j$.createSpy = createSpy;
  j$.Env = Env(j$);
  j$.ExceptionFormatter = ExceptionFormatter;
  j$.JsApiReporter = JsApiReporter;
  j$.QueueRunner = QueueRunner;
  j$.ReportDispatcher = ReportDispatcher;
  j$.Spec = Spec;
  j$.SpyRegistry = SpyRegistry;
  j$.Suite = Suite;
  j$.Timer = Timer;
  j$.TreeProcessor = TreeProcessor;
  j$.version = '2.5.2-light';

  return j$;
};

exports.interface = function(jasmine, env) {
  const jasmineInterface = {
    describe(description, specDefinitions) {
      return env.describe(description, specDefinitions);
    },

    xdescribe(description, specDefinitions) {
      return env.xdescribe(description, specDefinitions);
    },

    fdescribe(description, specDefinitions) {
      return env.fdescribe(description, specDefinitions);
    },

    it() {
      return env.it.apply(env, arguments);
    },

    xit() {
      return env.xit.apply(env, arguments);
    },

    fit() {
      return env.fit.apply(env, arguments);
    },

    beforeEach() {
      return env.beforeEach.apply(env, arguments);
    },

    afterEach() {
      return env.afterEach.apply(env, arguments);
    },

    beforeAll() {
      return env.beforeAll.apply(env, arguments);
    },

    afterAll() {
      return env.afterAll.apply(env, arguments);
    },

    pending() {
      return env.pending.apply(env, arguments);
    },

    fail() {
      return env.fail.apply(env, arguments);
    },

    spyOn(obj, methodName) {
      return env.spyOn(obj, methodName);
    },

    jsApiReporter: new jasmine.JsApiReporter({
      timer: new jasmine.Timer(),
    }),

    jasmine,
  };

  return jasmineInterface;
};
