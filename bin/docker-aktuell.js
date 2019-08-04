#!/usr/bin/env node

'use strict';

const buntstift = require('buntstift'),
  fs = require('fs'),
  path = require('path');

const dockerDir = path.join(__dirname, '../docker');

async function scanDirectory(dir) {
  if (fs.existsSync(dir)){
    let contents = fs.readdir(dir, async (err, files) => {
      if (err) {
        throw Error(err);
      }

      let found = findDockerFiles(dir, files);
      await found;
      return found;
    });

    await contents;
debugger;
    if (contents !== undefined) {
      let fullPath = contents.map((file) => {
        return path.join(dir, file);
      });
      await fullPath;
      buntstift.info(fullPath);
      return fullPath;
    }
  }
}

async function findDockerFiles(dirname, files) {
  debugger;
  return await files.map(async (file) => {
    let currentPath = path.join(dirname, file);
    if (fs.existsSync(currentPath) && 
        fs.lstatSync(currentPath).isDirectory()) {
      try {
       await scanDirectory(currentPath);
      } catch (err) {
        buntstift.error('oops! '+err);
        buntstift.error('currentPath: '+currentPath);
      }
      
    } else if (fs.existsSync(currentPath) && fs.lstatSync(currentPath).isFile()) {
      debugger;
      if (file == "Dockerfile") {
        //buntstift.info(currentPath);
        return readDockerFile(currentPath);
        //return currentPath;
      }
    }
  });
}

async function readDockerFile(file) {
  if (fs.existsSync(file) && fs.lstatSync(file).isFile()) {
    try {
      await fs.readFile(file, (err, data) => {
        const patternFrom = /(FROM\s)(.+?):(.+?)\n/;
        const baseImage = patternFrom.exec(data);
        buntstift.info(baseImage[3]);
      });
    } catch (err) {
    }
  }
}

(async () => {
    const found = scanDirectory(dockerDir);
    await found;
    return found;
})();
