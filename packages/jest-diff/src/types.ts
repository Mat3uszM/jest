/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export type DiffOptionsColor = (arg: string) => string; // subset of Chalk type

export type DiffOptions = {
  aAnnotation?: string;
  aColor?: DiffOptionsColor;
  aIndicator?: string;
  bAnnotation?: string;
  bColor?: DiffOptionsColor;
  bIndicator?: string;
  changeColor?: DiffOptionsColor;
  commonColor?: DiffOptionsColor;
  commonIndicator?: string;
  contextLines?: number;
  expand?: boolean;
  includeChangeCounts?: boolean;
  omitAnnotationLines?: boolean;
  patchColor?: DiffOptionsColor;
  trailingSpaceFormatter?: DiffOptionsColor;
  firstOrLastEmptyLineReplacement?: string;
};

export type DiffOptionsNormalized = {
  aAnnotation: string;
  aColor: DiffOptionsColor;
  aIndicator: string;
  bAnnotation: string;
  bColor: DiffOptionsColor;
  bIndicator: string;
  changeColor: DiffOptionsColor;
  commonColor: DiffOptionsColor;
  commonIndicator: string;
  contextLines: number;
  expand: boolean;
  includeChangeCounts: boolean;
  omitAnnotationLines: boolean;
  patchColor: DiffOptionsColor;
  trailingSpaceFormatter: DiffOptionsColor;
  firstOrLastEmptyLineReplacement: string;
};
