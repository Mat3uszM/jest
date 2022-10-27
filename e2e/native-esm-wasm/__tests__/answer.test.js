/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// the point here is that it's the node core module
// eslint-disable-next-line no-restricted-imports
import {readFileSync} from 'fs';
// The file was generated by wasm-pack
import {getAnswer} from '../answer.wasm';

const wasmFileBuffer = readFileSync('answer.wasm');

test('supports native wasm imports', () => {
  expect(getAnswer()).toBe(42);
});

test('supports imports from "data:application/wasm" URI with base64 encoding', async () => {
  const importedWasmModule = await import(
    `data:application/wasm;base64,${wasmFileBuffer.toString('base64')}`
  );
  expect(importedWasmModule.getAnswer()).toBe(42);
});

test('imports from "data:text/wasm" URI without explicit encoding fail', async () => {
  await expect(() =>
    import(`data:application/wasm,${wasmFileBuffer.toString('base64')}`),
  ).rejects.toThrow('Missing data URI encoding');
});

test('imports from "data:text/wasm" URI with invalid encoding fail', async () => {
  await expect(() =>
    import(`data:application/wasm,hex,${wasmFileBuffer.toString('hex')}`),
  ).rejects.toThrow('Missing data URI encoding');
});
