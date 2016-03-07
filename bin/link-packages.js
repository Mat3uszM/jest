#!/usr/bin/env node

'use strict';

const fs = require('graceful-fs');
const path = require('path');
const PACKAGE_ROOT = path.resolve(__dirname, './../packages/');
const NODE_MODULE_ROOT = path.resolve(__dirname, './../node_modules/');

function getPackages(packageRoot) {
  return fs.readdirSync(packageRoot).filter((file) => {
    return fs.statSync(path.join(packageRoot, file)).isDirectory();
  });
}

function removeFolder(target) {
  if (fs.existsSync(target)) {
    fs.readdirSync(target).forEach((file) => {
      const curPath = path.join(target, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        removeFolder(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(target);
  }
}

function checkLinks(packageRoot, nodeModuleRoot) {
  const packages = getPackages(packageRoot);
  packages.forEach((dir) => {
    const target = path.join(nodeModuleRoot, dir);
    const from = path.join(packageRoot, dir);
    // lstat does not follow the link
    fs.access(target, fs.F_OK, (err) => {
      if (err) {
        fs.symlinkSync(from, target);
      } else {
        if (fs.lstatSync(target).isDirectory()) {
          removeFolder(target);
          fs.symlinkSync(from, target);
        }
      }
    });

  });
}

if (process.env.NODE_ENV !== 'production') {
  checkLinks(PACKAGE_ROOT, NODE_MODULE_ROOT);
}
