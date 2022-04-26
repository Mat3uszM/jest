/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createHash} from 'crypto';
import * as path from 'path';
import * as fs from 'graceful-fs';
import {requireOrImportModule} from 'jest-util';
import blacklist from './blacklist';
import H from './constants';
import {extractor as defaultDependencyExtractor} from './lib/dependencyExtractor';
import type {
  DependencyExtractor,
  ExtractMetadataDefinition,
  ExtractedFileMetaData,
  HasteImpl,
} from './types';

const PACKAGE_JSON = `${path.sep}package.json`;

let hasteImpl: HasteImpl | null = null;
let hasteImplModulePath: string | null = null;

function sha1hex(content: string | Buffer): string {
  return createHash('sha1').update(content).digest('hex');
}

export async function extractMetadata(
  data: ExtractMetadataDefinition,
): Promise<ExtractedFileMetaData> {
  if (
    data.hasteImplModulePath &&
    data.hasteImplModulePath !== hasteImplModulePath
  ) {
    if (hasteImpl) {
      throw new Error('jest-haste-map: hasteImplModulePath changed');
    }
    hasteImplModulePath = data.hasteImplModulePath;
    hasteImpl = require(hasteImplModulePath);
  }

  let content: string | undefined;
  let dependencies: ExtractedFileMetaData['dependencies'];
  let id: ExtractedFileMetaData['id'];
  let module: ExtractedFileMetaData['module'];
  let sha1: ExtractedFileMetaData['sha1'];

  const {computeDependencies, computeSha1, rootDir, filePath} = data;

  const getContent = (): string => {
    if (content === undefined) {
      content = fs.readFileSync(filePath, 'utf8');
    }

    return content;
  };

  if (filePath.endsWith(PACKAGE_JSON)) {
    // Process a package.json that is returned as a PACKAGE type with its name.
    try {
      const fileData = JSON.parse(getContent());

      if (fileData.name) {
        const relativeFilePath = path.relative(rootDir, filePath);
        id = fileData.name;
        module = [relativeFilePath, H.PACKAGE];
      }
    } catch (err: any) {
      throw new Error(`Cannot parse ${filePath} as JSON: ${err.message}`);
    }
  } else if (!blacklist.has(filePath.substring(filePath.lastIndexOf('.')))) {
    // Process a random file that is returned as a MODULE.
    if (hasteImpl) {
      id = hasteImpl.getHasteName(filePath);
    }

    if (computeDependencies) {
      const content = getContent();
      const extractor = data.dependencyExtractor
        ? await requireOrImportModule<DependencyExtractor>(
            data.dependencyExtractor,
            false,
          )
        : defaultDependencyExtractor;
      dependencies = Array.from(
        extractor.extract(
          content,
          filePath,
          defaultDependencyExtractor.extract,
        ),
      );
    }

    if (id) {
      const relativeFilePath = path.relative(rootDir, filePath);
      module = [relativeFilePath, H.MODULE];
    }
  }

  // If a SHA-1 is requested on update, compute it.
  if (computeSha1) {
    sha1 = sha1hex(getContent() || fs.readFileSync(filePath));
  }

  return {dependencies, id, module, sha1};
}

export async function getSha1(
  data: ExtractMetadataDefinition,
): Promise<ExtractedFileMetaData> {
  const sha1 = data.computeSha1;

  return {
    dependencies: undefined,
    id: undefined,
    module: undefined,
    sha1,
  };
}
