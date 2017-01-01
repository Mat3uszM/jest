/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

let createRuntime;

describe('Runtime', () => {

  beforeEach(() => {
    createRuntime = require('createRuntime');
  });

  describe('jest.mock', () => {
    it('uses explicitly set mocks instead of automocking', () =>
      createRuntime(__filename).then(runtime => {
        const mockReference = {isMock: true};
        const root = runtime.requireModule(runtime.__mockRootPath, './root.js');
        // Erase module registry because root.js requires most other modules.
        root.jest.resetModuleRegistry();

        root.jest.mock('RegularModule', () => mockReference);
        root.jest.mock('ManuallyMocked', () => mockReference);

        expect(
          runtime.requireModuleOrMock(runtime.__mockRootPath, 'RegularModule'),
        ).toEqual(mockReference);

        expect(
          runtime.requireModuleOrMock(runtime.__mockRootPath, 'ManuallyMocked'),
        ).toEqual(mockReference);
      }),
    );

    it('sets virtual mock for non-existing module required from same directory', () =>
      createRuntime(__filename).then(runtime => {
        const mockReference = {isVirtualMock: true};
        const virtual = true;
        const root = runtime.requireModule(runtime.__mockRootPath, './root.js');
        // Erase module registry because root.js requires most other modules.
        root.jest.resetModuleRegistry();

        root.jest.mock('NotInstalledModule', () => mockReference, {virtual});
        root.jest.mock('../ManuallyMocked', () => mockReference, {virtual});
        root.jest.mock('/AbsolutePath/Mock', () => mockReference, {virtual});

        expect(
          runtime.requireModuleOrMock(
            runtime.__mockRootPath,
            'NotInstalledModule',
          ),
        ).toEqual(mockReference);

        expect(
          runtime.requireModuleOrMock(
            runtime.__mockRootPath,
            '../ManuallyMocked',
          ),
        ).toEqual(mockReference);

        expect(
          runtime.requireModuleOrMock(
            runtime.__mockRootPath,
            '/AbsolutePath/Mock',
          ),
        ).toEqual(mockReference);
      }),
    );
    
    it('sets virtual mock for non-existing module required from different directory', () =>
      createRuntime(__filename).then(runtime => {
        const mockReference = {isVirtualMock: true};
        const virtual = true;
        const root = runtime.requireModule(runtime.__mockRootPath, './root.js');
        // Erase module registry because root.js requires most other modules.
        root.jest.resetModuleRegistry();

        root.jest.mock('NotInstalledModule', () => mockReference, {virtual});
        root.jest.mock('../ManuallyMocked', () => mockReference, {virtual});
        root.jest.mock('/AbsolutePath/Mock', () => mockReference, {virtual});
        
        expect(
          runtime.requireModuleOrMock(
            runtime.__mockSubdirPath,
            'NotInstalledModule',
          ),
        ).toEqual(mockReference);

        expect(
          runtime.requireModuleOrMock(
            runtime.__mockSubdirPath,
            '../../../ManuallyMocked',
          ),
        ).toEqual(mockReference);

        expect(
          runtime.requireModuleOrMock(
            runtime.__mockSubdirPath,
            '/AbsolutePath/Mock',
          ),
        ).toEqual(mockReference);
      }),
    );
  });

  describe('jest.setMock', () => {
    it('uses explicitly set mocks instead of automocking', () =>
      createRuntime(__filename).then(runtime => {
        const mockReference = {isMock: true};
        const root = runtime.requireModule(runtime.__mockRootPath, './root.js');
        // Erase module registry because root.js requires most other modules.
        root.jest.resetModuleRegistry();

        root.jest.setMock('RegularModule', mockReference);
        root.jest.setMock('ManuallyMocked', mockReference);

        expect(
          runtime.requireModuleOrMock(runtime.__mockRootPath, 'RegularModule'),
        ).toBe(mockReference);

        expect(
          runtime.requireModuleOrMock(runtime.__mockRootPath, 'ManuallyMocked'),
        ).toBe(mockReference);
      }),
    );
  });
});
