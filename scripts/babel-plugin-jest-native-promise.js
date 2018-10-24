/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

// This plugin exists to make sure that we use a `Promise` that has not been messed with by user code.
// Might consider extending this to other globals as well in the future

module.exports = ({template}) => {
  const promiseDeclaration = template(`
    var Promise = global[Symbol.for('jest-native-promise')] || global.Promise;
  `);

  return {
    name: 'jest-native-promise',
    visitor: {
      ReferencedIdentifier(path, state) {
        if (path.node.name === 'Promise' && !state.injectedPromise) {
          state.injectedPromise = true;
          path
            .findParent(p => p.isProgram())
            .unshiftContainer('body', promiseDeclaration());
        }
      },
    },
  };
};
