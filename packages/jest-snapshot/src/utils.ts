/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import type {ParseResult, PluginItem} from '@babel/core';
import type {
  File,
  Node,
  Program,
  TemplateLiteral,
  TraversalAncestors,
} from '@babel/types';
import chalk = require('chalk');
import * as fs from 'graceful-fs';
import naturalCompare = require('natural-compare');
import type {Config} from '@jest/types';
import {
  type OptionsReceived as PrettyFormatOptions,
  format as prettyFormat,
} from 'pretty-format';
import {getSerializers} from './plugins';
import type {InlineSnapshot, SnapshotData} from './types';

export const SNAPSHOT_VERSION = '1';
const SNAPSHOT_VERSION_REGEXP = /^\/\/ Jest Snapshot v(.+),/;
export const SNAPSHOT_GUIDE_LINK = 'https://goo.gl/fbAQLP';
export const SNAPSHOT_VERSION_WARNING = chalk.yellow(
  `${chalk.bold('Warning')}: Before you upgrade snapshots, ` +
    'we recommend that you revert any local changes to tests or other code, ' +
    'to ensure that you do not store invalid state.',
);

const writeSnapshotVersion = () =>
  `// Jest Snapshot v${SNAPSHOT_VERSION}, ${SNAPSHOT_GUIDE_LINK}`;

const validateSnapshotVersion = (snapshotContents: string) => {
  const versionTest = SNAPSHOT_VERSION_REGEXP.exec(snapshotContents);
  const version = versionTest && versionTest[1];

  if (!version) {
    return new Error(
      chalk.red(
        `${chalk.bold('Outdated snapshot')}: No snapshot header found. ` +
          'Jest 19 introduced versioned snapshots to ensure all developers ' +
          'on a project are using the same version of Jest. ' +
          'Please update all snapshots during this upgrade of Jest.\n\n',
      ) + SNAPSHOT_VERSION_WARNING,
    );
  }

  if (version < SNAPSHOT_VERSION) {
    return new Error(
      // eslint-disable-next-line prefer-template
      chalk.red(
        `${chalk.red.bold('Outdated snapshot')}: The version of the snapshot ` +
          'file associated with this test is outdated. The snapshot file ' +
          'version ensures that all developers on a project are using ' +
          'the same version of Jest. ' +
          'Please update all snapshots during this upgrade of Jest.',
      ) +
        '\n\n' +
        `Expected: v${SNAPSHOT_VERSION}\n` +
        `Received: v${version}\n\n` +
        SNAPSHOT_VERSION_WARNING,
    );
  }

  if (version > SNAPSHOT_VERSION) {
    return new Error(
      // eslint-disable-next-line prefer-template
      chalk.red(
        `${chalk.red.bold('Outdated Jest version')}: The version of this ` +
          'snapshot file indicates that this project is meant to be used ' +
          'with a newer version of Jest. The snapshot file version ensures ' +
          'that all developers on a project are using the same version of ' +
          'Jest. Please update your version of Jest and re-run the tests.',
      ) +
        '\n\n' +
        `Expected: v${SNAPSHOT_VERSION}\n` +
        `Received: v${version}`,
    );
  }

  return null;
};

function isObject(item: unknown): boolean {
  return item != null && typeof item === 'object' && !Array.isArray(item);
}

export const testNameToKey = (testName: string, count: number): string =>
  `${testName} ${count}`;

export const keyToTestName = (key: string): string => {
  if (!/ \d+$/.test(key)) {
    throw new Error('Snapshot keys must end with a number.');
  }

  return key.replace(/ \d+$/, '');
};

export const getSnapshotData = (
  snapshotPath: string,
  update: Config.SnapshotUpdateState,
): {
  data: SnapshotData;
  dirty: boolean;
} => {
  const data = Object.create(null);
  let snapshotContents = '';
  let dirty = false;

  if (fs.existsSync(snapshotPath)) {
    try {
      snapshotContents = fs.readFileSync(snapshotPath, 'utf8');
      // eslint-disable-next-line no-new-func
      const populate = new Function('exports', snapshotContents);
      populate(data);
    } catch {}
  }

  const validationResult = validateSnapshotVersion(snapshotContents);
  const isInvalid = snapshotContents && validationResult;

  if (update === 'none' && isInvalid) {
    throw validationResult;
  }

  if ((update === 'all' || update === 'new') && isInvalid) {
    dirty = true;
  }

  return {data, dirty};
};

// Add extra line breaks at beginning and end of multiline snapshot
// to make the content easier to read.
export const addExtraLineBreaks = (string: string): string =>
  string.includes('\n') ? `\n${string}\n` : string;

// Remove extra line breaks at beginning and end of multiline snapshot.
// Instead of trim, which can remove additional newlines or spaces
// at beginning or end of the content from a custom serializer.
export const removeExtraLineBreaks = (string: string): string =>
  string.length > 2 && string.startsWith('\n') && string.endsWith('\n')
    ? string.slice(1, -1)
    : string;

export const removeLinesBeforeExternalMatcherTrap = (stack: string): string => {
  const lines = stack.split('\n');

  for (let i = 0; i < lines.length; i += 1) {
    // It's a function name specified in `packages/expect/src/index.ts`
    // for external custom matchers.
    if (lines[i].includes('__EXTERNAL_MATCHER_TRAP__')) {
      return lines.slice(i + 1).join('\n');
    }
  }

  return stack;
};

const escapeRegex = true;
const printFunctionName = false;

export const serialize = (
  val: unknown,
  indent = 2,
  formatOverrides: PrettyFormatOptions = {},
): string =>
  normalizeNewlines(
    prettyFormat(val, {
      escapeRegex,
      indent,
      plugins: getSerializers(),
      printFunctionName,
      ...formatOverrides,
    }),
  );

export const minify = (val: unknown): string =>
  prettyFormat(val, {
    escapeRegex,
    min: true,
    plugins: getSerializers(),
    printFunctionName,
  });

// Remove double quote marks and unescape double quotes and backslashes.
export const deserializeString = (stringified: string): string =>
  stringified.slice(1, -1).replace(/\\("|\\)/g, '$1');

export const escapeBacktickString = (str: string): string =>
  str.replace(/`|\\|\${/g, '\\$&');

const printBacktickString = (str: string): string =>
  `\`${escapeBacktickString(str)}\``;

export const ensureDirectoryExists = (filePath: string): void => {
  try {
    fs.mkdirSync(path.dirname(filePath), {recursive: true});
  } catch {}
};

const normalizeNewlines = (string: string) => string.replace(/\r\n|\r/g, '\n');

export const saveSnapshotFile = (
  snapshotData: SnapshotData,
  snapshotPath: string,
): void => {
  const snapshots = Object.keys(snapshotData)
    .sort(naturalCompare)
    .map(
      key =>
        `exports[${printBacktickString(key)}] = ${printBacktickString(
          normalizeNewlines(snapshotData[key]),
        )};`,
    );

  ensureDirectoryExists(snapshotPath);
  fs.writeFileSync(
    snapshotPath,
    `${writeSnapshotVersion()}\n\n${snapshots.join('\n\n')}\n`,
  );
};

const isAnyOrAnything = (input: object) =>
  '$$typeof' in input &&
  input.$$typeof === Symbol.for('jest.asymmetricMatcher') &&
  ['Any', 'Anything'].includes(input.constructor.name);

const deepMergeArray = (target: Array<any>, source: Array<any>) => {
  const mergedOutput = Array.from(target);

  for (const [index, sourceElement] of source.entries()) {
    const targetElement = mergedOutput[index];

    if (Array.isArray(target[index]) && Array.isArray(sourceElement)) {
      mergedOutput[index] = deepMergeArray(target[index], sourceElement);
    } else if (isObject(targetElement) && !isAnyOrAnything(sourceElement)) {
      mergedOutput[index] = deepMerge(target[index], sourceElement);
    } else {
      // Source does not exist in target or target is primitive and cannot be deep merged
      mergedOutput[index] = sourceElement;
    }
  }

  return mergedOutput;
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const deepMerge = (target: any, source: any): any => {
  if (isObject(target) && isObject(source)) {
    const mergedOutput = {...target};

    for (const key of Object.keys(source)) {
      if (isObject(source[key]) && !source[key].$$typeof) {
        if (key in target) {
          mergedOutput[key] = deepMerge(target[key], source[key]);
        } else {
          Object.assign(mergedOutput, {[key]: source[key]});
        }
      } else if (Array.isArray(source[key])) {
        mergedOutput[key] = deepMergeArray(target[key], source[key]);
      } else {
        Object.assign(mergedOutput, {[key]: source[key]});
      }
    }

    return mergedOutput;
  } else if (Array.isArray(target) && Array.isArray(source)) {
    return deepMergeArray(target, source);
  }

  return target;
};

const indent = (
  snapshot: string,
  numIndents: number,
  indentation: string,
): string => {
  const lines = snapshot.split('\n');
  // Prevent re-indentation of inline snapshots.
  if (
    lines.length >= 2 &&
    lines[1].startsWith(indentation.repeat(numIndents + 1))
  ) {
    return snapshot;
  }

  return lines
    .map((line, index) => {
      if (index === 0) {
        // First line is either a 1-line snapshot or a blank line.
        return line;
      } else if (index === lines.length - 1) {
        // The last line should be placed on the same level as the expect call.
        return indentation.repeat(numIndents) + line;
      } else {
        // Do not indent empty lines.
        if (line === '') {
          return line;
        }

        // Not last line, indent one level deeper than expect call.
        return indentation.repeat(numIndents + 1) + line;
      }
    })
    .join('\n');
};

const generate = // @ts-expect-error requireOutside Babel transform
  (requireOutside('@babel/generator') as typeof import('@babel/generator'))
    .default;

// @ts-expect-error requireOutside Babel transform
const {parseSync, types} = requireOutside(
  '@babel/core',
) as typeof import('@babel/core');
const {
  isAwaitExpression,
  templateElement,
  templateLiteral,
  traverseFast,
  traverse,
} = types;

export const processInlineSnapshotsWithBabel = (
  snapshots: Array<InlineSnapshot>,
  sourceFilePath: string,
  rootDir: string,
): {
  snapshotMatcherNames: Array<string>;
  sourceFile: string;
  sourceFileWithSnapshots: string;
} => {
  const sourceFile = fs.readFileSync(sourceFilePath, 'utf8');

  // TypeScript projects may not have a babel config; make sure they can be parsed anyway.
  const presets = [require.resolve('babel-preset-current-node-syntax')];
  const plugins: Array<PluginItem> = [];
  if (/\.([cm]?ts|tsx)$/.test(sourceFilePath)) {
    plugins.push([
      require.resolve('@babel/plugin-syntax-typescript'),
      {isTSX: sourceFilePath.endsWith('x')},
      // unique name to make sure Babel does not complain about a possible duplicate plugin.
      'TypeScript syntax plugin added by Jest snapshot',
    ]);
  }

  // Record the matcher names seen during traversal and pass them down one
  // by one to formatting parser.
  const snapshotMatcherNames: Array<string> = [];

  let ast: ParseResult | null = null;

  try {
    ast = parseSync(sourceFile, {
      filename: sourceFilePath,
      plugins,
      presets,
      root: rootDir,
    });
  } catch (error: any) {
    // attempt to recover from missing jsx plugin
    if (error.message.includes('@babel/plugin-syntax-jsx')) {
      try {
        const jsxSyntaxPlugin: PluginItem = [
          require.resolve('@babel/plugin-syntax-jsx'),
          {},
          // unique name to make sure Babel does not complain about a possible duplicate plugin.
          'JSX syntax plugin added by Jest snapshot',
        ];
        ast = parseSync(sourceFile, {
          filename: sourceFilePath,
          plugins: [...plugins, jsxSyntaxPlugin],
          presets,
          root: rootDir,
        });
      } catch {
        throw error;
      }
    } else {
      throw error;
    }
  }

  if (!ast) {
    throw new Error(`jest-snapshot: Failed to parse ${sourceFilePath}`);
  }
  traverseAst(snapshots, ast, snapshotMatcherNames);

  return {
    snapshotMatcherNames,
    sourceFile,
    // substitute in the snapshots in reverse order, so slice calculations aren't thrown off.
    sourceFileWithSnapshots: snapshots.reduceRight(
      (sourceSoFar, nextSnapshot) => {
        const {node} = nextSnapshot;
        if (
          !node ||
          typeof node.start !== 'number' ||
          typeof node.end !== 'number'
        ) {
          throw new Error('Jest: no snapshot insert location found');
        }

        // A hack to prevent unexpected line breaks in the generated code
        node.loc!.end.line = node.loc!.start.line;

        return (
          sourceSoFar.slice(0, node.start) +
          generate(node, {retainLines: true}).code.trim() +
          sourceSoFar.slice(node.end)
        );
      },
      sourceFile,
    ),
  };
};

export const processPrettierAst = (
  ast: File,
  options: Record<string, any> | null,
  snapshotMatcherNames: Array<string>,
  keepNode?: boolean,
): void => {
  traverse(ast, (node: Node, ancestors: TraversalAncestors) => {
    if (node.type !== 'CallExpression') return;

    const {arguments: args, callee} = node;
    if (
      callee.type !== 'MemberExpression' ||
      callee.property.type !== 'Identifier' ||
      !snapshotMatcherNames.includes(callee.property.name) ||
      !callee.loc ||
      callee.computed
    ) {
      return;
    }

    let snapshotIndex: number | undefined;
    let snapshot: string | undefined;
    for (let i = 0; i < args.length; i++) {
      const node = args[i];
      if (node.type === 'TemplateLiteral') {
        snapshotIndex = i;
        snapshot = node.quasis[0].value.raw;
      }
    }
    if (snapshot === undefined) {
      return;
    }

    const parent = ancestors.at(-1).node;
    const startColumn =
      isAwaitExpression(parent) && parent.loc
        ? parent.loc.start.column
        : callee.loc.start.column;

    const useSpaces = !options?.useTabs;
    snapshot = indent(
      snapshot,
      Math.ceil(
        useSpaces
          ? startColumn / (options?.tabWidth ?? 1)
          : // Each tab is 2 characters.
            startColumn / 2,
      ),
      useSpaces ? ' '.repeat(options?.tabWidth ?? 1) : '\t',
    );

    if (keepNode) {
      (args[snapshotIndex!] as TemplateLiteral).quasis[0].value.raw = snapshot;
    } else {
      const replacementNode = templateLiteral(
        [
          templateElement({
            raw: snapshot,
          }),
        ],
        [],
      );
      args[snapshotIndex!] = replacementNode;
    }
  });
};

const groupSnapshotsBy =
  (createKey: (inlineSnapshot: InlineSnapshot) => string) =>
  (snapshots: Array<InlineSnapshot>) =>
    snapshots.reduce<Record<string, Array<InlineSnapshot>>>(
      (object, inlineSnapshot) => {
        const key = createKey(inlineSnapshot);
        return {...object, [key]: (object[key] || []).concat(inlineSnapshot)};
      },
      {},
    );

const groupSnapshotsByFrame = groupSnapshotsBy(({frame: {line, column}}) =>
  typeof line === 'number' && typeof column === 'number'
    ? `${line}:${column - 1}`
    : '',
);
export const groupSnapshotsByFile = groupSnapshotsBy(({frame: {file}}) => file);

const traverseAst = (
  snapshots: Array<InlineSnapshot>,
  ast: File | Program,
  snapshotMatcherNames: Array<string>,
) => {
  const groupedSnapshots = groupSnapshotsByFrame(snapshots);
  const remainingSnapshots = new Set(snapshots.map(({snapshot}) => snapshot));

  traverseFast(ast, (node: Node) => {
    if (node.type !== 'CallExpression') return;

    const {arguments: args, callee} = node;
    if (
      callee.type !== 'MemberExpression' ||
      callee.property.type !== 'Identifier' ||
      callee.property.loc == null
    ) {
      return;
    }
    const {line, column} = callee.property.loc.start;
    const snapshotsForFrame = groupedSnapshots[`${line}:${column}`];
    if (!snapshotsForFrame) {
      return;
    }
    if (snapshotsForFrame.length > 1) {
      throw new Error(
        'Jest: Multiple inline snapshots for the same call are not supported.',
      );
    }
    const inlineSnapshot = snapshotsForFrame[0];
    inlineSnapshot.node = node;

    snapshotMatcherNames.push(callee.property.name);

    const snapshotIndex = args.findIndex(
      ({type}) => type === 'TemplateLiteral' || type === 'StringLiteral',
    );

    const {snapshot} = inlineSnapshot;
    remainingSnapshots.delete(snapshot);
    const replacementNode = templateLiteral(
      [templateElement({raw: escapeBacktickString(snapshot)})],
      [],
    );

    if (snapshotIndex > -1) {
      args[snapshotIndex] = replacementNode;
    } else {
      args.push(replacementNode);
    }
  });

  if (remainingSnapshots.size > 0) {
    throw new Error("Jest: Couldn't locate all inline snapshots.");
  }
};
