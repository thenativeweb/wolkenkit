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
        const patternFrom = /FROM\s(.+?):(.+?)\n/;
        const patternUsername = /^([\w\.-]+?)\/(.+)$/;
        const baseImage = patternFrom.exec(data);
        if (patternUsername.test(baseImage[1])) {
          const lib = patternUsername.exec(baseImage[1]);
          requestTags(lib[1], lib[2], baseImage[2], 200);
        } else {
          requestTags("library", baseImage[1], baseImage[2], 200);
        }
      });
    } catch (err) {
    }
  }
}

async function extractNameAndUpDate(data) {
  return data.map((result) => {
    return {'name': result.name, 'lastUpdated': result.last_updated};
  });
}

async function parseScheme(scheme) {
  const toParse = scheme.split("");
  let char;
  let previousChar;
  let accumulator = [];
  let letter = /[a-zA-Z]/;
  let number = /[0-9]/;
  let symbol = /[\-\.]/;
  for (char of toParse) {
    if (letter.test(char)) {
        if (previousChar && previousChar.type == 'Letter') {
          accumulator[0].data.push(char);
        } else {
          accumulator.push({ 'type':'Letter', 'data':[char] });
        }
        previousChar = 'Letter';
    } else if (number.test(char)) {
        if (previousChar && previousChar.type == 'Number') {
          accumulator[0].data.push(char);
        } else {
           accumulator.push({ 'type':'Number', 'data':[char] });
        }
        previousChar = char;
    } else if (symbol.test(char)) {
        if (previousChar && previousChar.type == 'Symbol') {
          accumulator[0].data.push(char);
        } else {
           accumulator.push({ 'type':'Symbol', 'data':[char] });
        }
        previousChar = char;
    } else {
      throw `Unrecognized character ${char}`;
    }
  }
  return accumulator;
}

async function buildRegex(structuredScheme) {
  debugger;
  let regex = '^';
  for (let i=0; i<structuredScheme.length; i++) {
    switch (structuredScheme[i].type) {
      case 'Letter':
        for (let j=0; j<structuredScheme[i].data.length; j++) {
          regex += `${structuredScheme[i].data[j]}`;
        }
        break;
      case 'Number':
        if (i > 0 && structuredScheme[i-1].type !== 'Number') {
          regex += '\\d+?';
        } else if (i == 0) {
          regex += '\\d+?';
        }
        break;
      case 'Symbol':
        for (let j=0; j<structuredScheme[i].data.length; j++) {
          regex += `\\${structuredScheme[i].data[j]}`;
        }
        break;
      default:
        throw `Unrecognized structured scheme data type ${structuredScheme[i].type}`;
    }
  }
  regex += '$';
  regex = new RegExp(regex);
  return regex;
}

async function sortImages(images, regex) {
  const matches = await images.map( (image) => {
    if (regex.test(image.name)) {
      return image;
    }
  });

  const filteredMatches = await matches.filter( (m) => {
    return m != null;
  });

  return filteredMatches;
}

function filterMajorRelease(imageInQuestion) {
  const majorRelease = /(^\d{1,2}\.\d{1,2})/.exec(imageInQuestion.name);
  return majorRelease[1];
}

async function findLatest(images, imageInUse) {
  if (imageInUse[0] != null) {
    if (/^\d{1,2}?\.\d{1,2}?/.test(images[0].name)) { // image is using semver
      buntstift.info(images[0].name);
      const releaseInQuestion = filterMajorRelease(imageInUse[0]);
      const namesDescending = images.map(filterMajorRelease).sort((a,b) => {return b - a});
      buntstift.info(namesDescending);
    }
  } else {
    // warn the user that the image in use could not be found and 
    // is either outdated or malformed
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
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', async () => {
      try {
        const parsedData = JSON.parse(rawData);
        const results = await extractNameAndUpDate(parsedData.results);
        const structuredScheme = await parseScheme(scheme);
        const generatedRegex = await buildRegex(structuredScheme);
        const matches = await sortImages(results, generatedRegex);
        const imageInUse = await sortImages(results, new RegExp(`^${scheme}$`));
        findLatest(matches, imageInUse);
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
