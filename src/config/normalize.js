'use strict';

const path = require('path');
const utils = require('jest-util');
const DEFAULT_CONFIG_VALUES = require('./defaults');

function replaceRootDirTags(rootDir, config) {
  switch (typeof config) {
    case 'object':
      if (config instanceof RegExp) {
        return config;
      }

      if (Array.isArray(config)) {
        return config.map(function(item) {
          return replaceRootDirTags(rootDir, item);
        });
      }

      if (config !== null) {
        const newConfig = {};
        for (const configKey in config) {
          newConfig[configKey] =
            configKey === 'rootDir'
              ? config[configKey]
              : replaceRootDirTags(rootDir, config[configKey]);
        }
        return newConfig;
      }
      break;
    case 'string':
      if (!/^<rootDir>/.test(config)) {
        return config;
      }

      return path.resolve(
        rootDir,
        path.normalize('./' + config.substr('<rootDir>'.length))
      );
  }
  return config;
}

function _addDot(ext) {
  return '.' + ext;
}

function uniqueStrings(set) {
  const newSet = [];
  const has = {};
  set.forEach(function(item) {
    if (!has[item]) {
      has[item] = true;
      newSet.push(item);
    }
  });
  return newSet;
}

function normalize(config, argv) {
  if (!argv) {
    argv = {};
  }
  const newConfig = {};

  // Assert that there *is* a rootDir
  if (!config.hasOwnProperty('rootDir')) {
    throw new Error('No rootDir config value found!');
  }

  config.rootDir = path.normalize(config.rootDir);

  if (config.setupEnvScriptFile) {
    if (!config.setupFiles) {
      config.setupFiles = [];
    }
    config.setupFiles.push(config.setupEnvScriptFile);
    delete config.setupEnvScriptFile;
  }

  if (argv.testRunner) {
    config.testRunner = argv.testRunner;
  }

  if (config.testRunner === 'jasmine1') {
    config.testRunner = require.resolve('../testRunners/jasmine/jasmine1');
  } else if (!config.testRunner || config.testRunner === 'jasmine2') {
    config.testRunner = require.resolve('../testRunners/jasmine/jasmine2');
  } else {
    try {
      config.testRunner = path.resolve(
        config.testRunner.replace(/<rootDir>/g, config.rootDir)
      );
    } catch (e) {
      throw new Error(
        `Jest: Invalid testRunner path: ${config.testRunner}`
      );
    }
  }

  // Normalize user-supplied config options
  Object.keys(config).reduce(function(newConfig, key) {
    let value;
    switch (key) {
      case 'collectCoverageOnlyFrom':
        value = Object.keys(config[key]).reduce(function(normObj, filePath) {
          filePath = path.resolve(
            config.rootDir,
            replaceRootDirTags(config.rootDir, filePath)
          );
          normObj[filePath] = true;
          return normObj;
        }, {});
        break;

      case 'setupFiles':
      case 'testPathDirs':
        value = config[key].map(filePath => path.resolve(
          config.rootDir,
          replaceRootDirTags(config.rootDir, filePath)
        ));
        break;

      case 'cacheDirectory':
      case 'testRunner':
      case 'scriptPreprocessor':
      case 'setupTestFrameworkScriptFile':
        value = path.resolve(
          config.rootDir,
          replaceRootDirTags(config.rootDir, config[key])
        );
        break;

      case 'moduleNameMapper':
        value = Object.keys(config[key]).map(regex => [
          regex,
          replaceRootDirTags(config.rootDir, config[key][regex]),
        ]);
        break;

      case 'preprocessorIgnorePatterns':
      case 'testPathIgnorePatterns':
      case 'modulePathIgnorePatterns':
      case 'unmockedModulePathPatterns':
        // replaceRootDirTags is specifically well-suited for substituting
        // <rootDir> in paths (it deals with properly interpreting relative path
        // separators, etc).
        //
        // For patterns, direct global substitution is far more ideal, so we
        // special case substitutions for patterns here.
        value = config[key].map(function(pattern) {
          return utils.replacePathSepForRegex(
            pattern.replace(/<rootDir>/g, config.rootDir)
          );
        });
        break;
      case 'bail':
      case 'preprocessCachingDisabled':
      case 'coverageReporters':
      case 'collectCoverage':
      case 'coverageCollector':
      case 'globals':
      case 'haste':
      case 'mocksPattern':
      case 'moduleLoader':
      case 'name':
      case 'persistModuleRegistryBetweenSpecs':
      case 'rootDir':
      case 'setupJSLoaderOptions':
      case 'setupJSTestLoaderOptions':
      case 'setupJSMockLoaderOptions':
      case 'testDirectoryName':
      case 'testEnvData':
      case 'testFileExtensions':
      case 'testPathPattern':
      case 'testReporter':
      case 'testURL':
      case 'moduleFileExtensions':
      case 'noHighlight':
      case 'noStackTrace':
      case 'logHeapUsage':
      case 'cache':
      case 'watchman':
      case 'verbose':
      case 'automock':
      case 'testEnvironment':
        value = config[key];
        break;

      default:
        console.error(
          `Error: Unknown config option "${key}" with value ` +
          `"${config[key]}". This is either a typing error or another user ` +
          `mistake and fixing it will remove this message.`
        );
    }
    newConfig[key] = value;
    return newConfig;
  }, newConfig);

  // If any config entries weren't specified but have default values, apply the
  // default values
  Object.keys(DEFAULT_CONFIG_VALUES).reduce(function(newConfig, key) {
    if (!newConfig[key]) {
      newConfig[key] = DEFAULT_CONFIG_VALUES[key];
    }
    return newConfig;
  }, newConfig);

  // Fill in some default values for node-haste config
  newConfig.setupJSLoaderOptions = newConfig.setupJSLoaderOptions || {};
  newConfig.setupJSTestLoaderOptions = newConfig.setupJSTestLoaderOptions || {};
  newConfig.setupJSMockLoaderOptions = newConfig.setupJSMockLoaderOptions || {};

  if (!newConfig.setupJSTestLoaderOptions.extensions) {
    newConfig.setupJSTestLoaderOptions.extensions =
      newConfig.testFileExtensions.map(_addDot);
  }

  if (!newConfig.setupJSLoaderOptions.extensions) {
    newConfig.setupJSLoaderOptions.extensions = uniqueStrings(
      newConfig.moduleFileExtensions.map(_addDot).concat(
        newConfig.setupJSTestLoaderOptions.extensions
      )
    );
  }

  if (!newConfig.setupJSMockLoaderOptions.extensions) {
    newConfig.setupJSMockLoaderOptions.extensions =
      newConfig.setupJSLoaderOptions.extensions;
  }

  return replaceRootDirTags(newConfig.rootDir, newConfig);
}

module.exports = normalize;
