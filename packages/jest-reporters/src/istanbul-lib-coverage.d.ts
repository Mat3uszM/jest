/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

declare module 'istanbul-lib-coverage' {
  export interface CoverageSummaryData {
    lines: Totals;
    statements: Totals;
    branches: Totals;
    functions: Totals;
  }

  export class CoverageSummary {
    constructor(data: CoverageSummary | CoverageSummaryData);
    merge(obj: CoverageSummary): CoverageSummary;
    toJSON(): CoverageSummaryData;
    isEmpty(): boolean;
    data: CoverageSummaryData;
    lines: Totals;
    statements: Totals;
    branches: Totals;
    functions: Totals;
  }

  export interface CoverageMapData {
    [key: string]: FileCoverage;
  }

  export class CoverageMap {
    constructor(data: CoverageMapData | CoverageMap);
    addFileCoverage(
      pathOrObject: string | FileCoverage | FileCoverageData,
    ): void;
    files(): Array<string>;
    fileCoverageFor(filename: string): FileCoverage;
    filter(callback: (key: string) => boolean): void;
    getCoverageSummary(): CoverageSummary;
    merge(data: CoverageMapData | CoverageMap): void;
    toJSON(): CoverageMapData;
    data: CoverageMapData;
  }

  export interface Location {
    line: number;
    column: number;
  }

  export interface Range {
    start: Location;
    end: Location;
  }

  export interface BranchMapping {
    loc: Range;
    type: string;
    locations: Array<Range>;
    line: number;
  }

  export interface FunctionMapping {
    name: string;
    decl: Range;
    loc: Range;
    line: number;
  }

  export interface FileCoverageData {
    path: string;
    statementMap: {[key: string]: Range};
    fnMap: {[key: string]: FunctionMapping};
    branchMap: {[key: string]: BranchMapping};
    s: {[key: string]: number};
    f: {[key: string]: number};
    b: {[key: string]: Array<number>};
  }

  export interface Totals {
    total: number;
    covered: number;
    skipped: number;
    pct: number;
  }

  export interface Coverage {
    covered: number;
    total: number;
    coverage: number;
  }

  export class FileCoverage implements FileCoverageData {
    constructor(data: string | FileCoverage | FileCoverageData);
    merge(other: FileCoverageData): void;
    getBranchCoverageByLine(): {[line: number]: Coverage};
    getLineCoverage(): {[line: number]: number};
    getUncoveredLines(): Array<number>;
    resetHits(): void;
    computeBranchTotals(): Totals;
    computeSimpleTotals(): Totals;
    toSummary(): CoverageSummary;
    toJSON(): object;

    data: FileCoverageData;
    path: string;
    statementMap: {[key: string]: Range};
    fnMap: {[key: string]: FunctionMapping};
    branchMap: {[key: string]: BranchMapping};
    s: {[key: string]: number};
    f: {[key: string]: number};
    b: {[key: string]: Array<number>};
  }

  export const classes: {
    FileCoverage: typeof FileCoverage;
  };

  export function createCoverageMap(
    data?: CoverageMap | CoverageMapData,
  ): CoverageMap;
  export function createCoverageSummary(
    obj?: CoverageSummary | CoverageSummaryData,
  ): CoverageSummary;
  export function createFileCoverage(
    pathOrObject: string | FileCoverage | FileCoverageData,
  ): FileCoverage;
}
