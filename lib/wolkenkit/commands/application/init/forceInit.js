'use strict';

const path = require('path');

const isolated = require('isolated'),
      promisify = require('util.promisify'),
      recursiveReaddirCallback = require('recursive-readdir');

const cloneRepository = require('./cloneRepository'),
      shell = require('../../../../shell');

const recursiveReaddir = promisify(recursiveReaddirCallback);

const forceInit = async function ({ directory, template }, progress) {
  if (!directory) {
    throw new Error('Directory is missing.');
  }
  if (!template) {
    throw new Error('Template is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const tempDirectory = await isolated();

  await cloneRepository({ directory: tempDirectory, template }, progress);

  const clonedFiles = await recursiveReaddir(tempDirectory, [ '.git' ]),
        files = await recursiveReaddir(directory, [ '.git' ]);

  for (let i = 0; i < clonedFiles.length; i++) {
    const clonedFile = clonedFiles[i],
          clonedFileName = clonedFile.replace(`${tempDirectory}${path.sep}`, '');

    const file = files.find(filePath => {
      const fileName = filePath.replace(`${directory}${path.sep}`, '');

      return clonedFileName === fileName;
    });

    if (file) {
      progress({ message: `Creating backup file for ${clonedFileName}...` });
      await shell.mv('-f', file, `${file}.bak`);
    }

    const targetFile = path.join(directory, clonedFileName);

    await shell.mkdir('-p', path.dirname(targetFile));
    await shell.mv('-f', clonedFile, targetFile);
  }

  await shell.rm('-rf', tempDirectory);
};

module.exports = forceInit;
