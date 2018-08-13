jest.mock('path');

import {replacePathSepForRegex, escapeStrForRegex} from '../index';
import path from 'path';

describe('replacePathSepForRegex()', () => {
  describe('posix', () => {
    beforeEach(() => (path.sep = '/'));

    it('should return the path', () => {
      const expected = {};
      expect(replacePathSepForRegex(expected)).toBe(expected);
    });
  });

  describe('escapeStrForRegex', () => {
    it('returns empty regex when given empty string', () => {
      expect(escapeStrForRegex('')).toBe('^$');
    });

    it('returns regex for given string: [0-9]', () => {
      expect(escapeStrForRegex('[0-9]')).toBe('\\[0-9\\]');
    });
  });

  describe('win32', () => {
    beforeEach(() => (path.sep = '\\'));

    it('should replace POSIX path separators', () => {
      expect(replacePathSepForRegex('a/b/c')).toBe('a\\\\b\\\\c');

      // When a regular expression is created with a string, not enclosing
      // slashes like "/<pattern>/", the "/" character does not need to be
      // escaped as "\/". The result is the double path separator: "\\"
      expect(replacePathSepForRegex('a\\/b')).toBe('a\\\\\\\\b');
    });

    it('should escape Windows path separators', () => {
      expect(replacePathSepForRegex('a\\b\\c')).toBe('a\\\\b\\\\c');
    });

    it('should not escape an escaped dot', () => {
      expect(replacePathSepForRegex('a\\.dotfile')).toBe('a\\.dotfile');
      expect(replacePathSepForRegex('a\\\\\\.dotfile')).toBe('a\\\\\\.dotfile');
    });

    it('should not escape an escaped regexp symbol', () => {
      expect(replacePathSepForRegex('b\\(86')).toBe('b\\(86');
    });

    it('should escape Windows path separators inside groups', () => {
      expect(replacePathSepForRegex('[/\\\\]')).toBe('[\\\\\\\\]');
    });

    it('should escape Windows path separator at the beginning', () => {
      expect(replacePathSepForRegex('\\a')).toBe('\\\\a');
    });

    it('should not escape several already escaped path separators', () => {
      expect(replacePathSepForRegex('\\\\\\\\')).toBe('\\\\\\\\');
    });
  });
});
