#!/usr/bin/env node

'use strict';

const buntstift = require('buntstift'),
  fs = require('fs'),
  path = require('path'),
  https = require('https');

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
debugger;
        const patternFrom = /FROM\s(.+?):(.+?)\n/;
        const patternUsername = /^([\w\.-]+?)\/(.+)$/;
        const baseImage = patternFrom.exec(data);

        if (patternUsername.test(baseImage[1])) {
          const lib = patternUsername.exec(baseImage[1]);
          //buntstift.info(baseImage[1]);
          //buntstift.info(lib[1]+" "+lib[2]+" "+baseImage[2]+" "+baseImage[0]);
          requestTags(lib[1], lib[2],baseImage[2]);
        } else {
          //buntstift.info("library"+" "+baseImage[1]+" "+baseImage[2]+" "+baseImage[0])
          requestTags("library", baseImage[1], baseImage[2]);
        }
        //buntstift.info(baseImage[1], baseImage[2], baseImage[3]);
        //requestTags(baseImage[1], baseImage[2], 100);
      });
    } catch (err) {
    }
  }
}

async function requestTags(username, library, scheme, pageSize) {
  await https.get(`https://hub.docker.com/v2/repositories/${username}/${library}/tags/?page_size=${pageSize}`, (res) => {
    const { statusCode } = res;
    const contentType = res.headers['content-type'];

    let error;
    if (statusCode !== 200) {
      error = new Error(`Request Failed for ${library}.\n` + `Status Code: ${statusCode}`);
    } else if (!/^application\/json/.test(contentType)){
      error = new Error('Invalid content-type.\n' + `Expected application/json but recieved ${contentType}`);
    }
    if (error) {
      buntstift.error(error.message);
      res.resume();
      return;
    }

    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (chunk) => {rawData += chunk; });
    res.on('end', () => {
      try {
        const parsedData = JSON.parse(rawData);
        buntstift.info(parsedData.results);
      } catch (e) {
        buntstift.error(e);
      }
    });
  }).on('error', (e) => {
    buntstift.error(`Got error: ${e.message}`);
  }); 
}

(async () => {
  const stop = buntstift.wait();
    const found = scanDirectory(dockerDir);
    await found;
  stop();
    return found;
})();
