/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import chalk = require('chalk');
import type {Config} from '@jest/types';
import getProjectDisplayName from './getProjectDisplayName';

export default function getSelectProjectsMessage(
  projectConfigs: Array<Config.ProjectConfig>,
): string {
  if (projectConfigs.length === 0) {
    return getNoSelectionWarning();
  }
  const numberOfProjectsWithoutAName = projectConfigs.filter(
    config => !getProjectDisplayName(config),
  ).length;
  return (
    getNamesMissingWarning(numberOfProjectsWithoutAName) +
    getProjectsRunningMessage(projectConfigs)
  );
}

function getNoSelectionWarning(): string {
  return chalk.yellow(
    'You provided values for --selectProjects but no projects were found matching the selection.\n',
  );
}

function getNamesMissingWarning(numberOfProjectsWithoutAName: number): string {
  if (numberOfProjectsWithoutAName === 0) {
    return '';
  }
  return chalk.yellow(
    `You provided values for --selectProjects but ${
      numberOfProjectsWithoutAName === 1
        ? 'a project has'
        : `${numberOfProjectsWithoutAName} projects have`
    } no name.\n` +
      'Set displayName in the config of all projects in order to disable this warning.\n',
  );
}

function getProjectsRunningMessage(
  projectConfigs: Array<Config.ProjectConfig>,
): string {
  if (projectConfigs.length === 1) {
    const name = getProjectDisplayName(projectConfigs[0]);
    return `Running one project: ${chalk.bold(name)}\n`;
  }
  const projectsList = projectConfigs
    .map(getProjectNameListElement)
    .sort()
    .join('\n');
  return `Running ${projectConfigs.length} projects:\n${projectsList}\n`;
}

function getProjectNameListElement(
  projectConfig: Config.ProjectConfig,
): string {
  const name = getProjectDisplayName(projectConfig);
  const elementContent = name ? chalk.bold(name) : '<unnamed project>';
  return `- ${elementContent}`;
}
