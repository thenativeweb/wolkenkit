'use strict';

const path = require('path');

const isolated = require('isolated'),
      promisify = require('util.promisify'),
      recursiveReaddir = require('recursive-readdir');

const errors = require('../../../errors'),
      noop = require('../../../noop'),
      shell = require('../../../shell');

const isolatedAsync = promisify(isolated),
      recursiveReaddirAsync = promisify(recursiveReaddir);

const init = async function (options, progress = noop) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.directory) {
    throw new Error('Directory is missing.');
  }
  if (!options.template) {
    throw new Error('Template is missing.');
  }
  if (options.force === undefined) {
    throw new Error('Force is missing.');
  }

  const { directory, template, force } = options;

  const matches = template.match(/^((?:git:|ssh:|https:\/\/|git@[\w.]+)[\w.@:/~_-]+(?:\.git)?\/?)(?:#([a-zA-Z0-9/.\-_]+))?$/);

  if (!matches) {
    progress({ message: 'Malformed url.', type: 'info' });

    throw new errors.UrlMalformed();
  }

  if (!await shell.which('git')) {
    progress({ message: 'git is not installed.', type: 'info' });

    throw new errors.ExecutableNotFound();
  }

  const [ , url, branch ] = matches;
  const branchOption = branch ? `--branch ${branch}` : '';

  const cloneRepository = async function (cwd) {
    progress({ message: `Cloning ${template}...` });

    try {
      await shell.exec(`git clone ${branchOption} ${url} .`, { silent: true, cwd });
    } catch (ex) {
      progress({ message: `${ex.stderr}` });
      progress({ message: 'git failed to clone the template.', type: 'info' });

      throw ex;
    }
  };

  if (force) {
    const tempDirectory = await isolatedAsync();

    await cloneRepository(tempDirectory);

    const clonedFiles = await recursiveReaddirAsync(tempDirectory, [ '.git' ]),
          files = await recursiveReaddirAsync(directory, [ '.git' ]);

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

    return;
  }

  const files = await recursiveReaddirAsync(directory);

  if (files.length > 0) {
    progress({ message: 'The current working directory is not empty.', type: 'info' });

    throw new errors.DirectoryNotEmpty();
  }

  await cloneRepository(directory);

  await shell.rm('-rf', path.join(directory, '.git'));
};

module.exports = init;
