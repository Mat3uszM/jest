/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

describe('block with only, should pass', () => {
  it.skip.failing('skipped failing fails = passes, should pass', () => {
    expect(10).toBe(101);
  });

  it('failing test', () => {
    expect(10).toBe(101);
  });

  it.skip('passing test', () => {
    expect(10).toBe(10);
  });

  it.failing('failing fails = passes', () => {
    expect(10).toBe(101);
  });
});

describe('block with only, should fail', () => {
  it.skip.failing('failing passes = fails, should fail', () => {
    expect(10).toBe(10);
  });

  it.skip('failing test', () => {
    expect(10).toBe(101);
  });

  it('passing test', () => {
    expect(10).toBe(10);
  });

  it.failing('failing passes = fails', () => {
    expect(10).toBe(101);
  });
});
