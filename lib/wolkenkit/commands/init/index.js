'use strict';

const fs = require('fs'),
      path = require('path');

const promisify = require('util.promisify');

const errors = require('../../../errors'),
      noop = require('../../../noop'),
      shell = require('../../../shell');

const readdir = promisify(fs.readdir);

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

  const { directory, template } = options;

  const matches = template.match(/^((?:git:|ssh:|https:\/\/|git@[\w.]+)[\w.@:/~_-]+(?:\.git)?\/?)(?:#([a-zA-Z0-9/.\-_]+))?$/);

  if (!matches) {
    progress({ message: 'Malformed url.', type: 'info' });

    throw new errors.UrlMalformed();
  }

  const [ , url, branch ] = matches;

  const entries = await readdir(directory);

  if (entries.length > 0) {
    progress({ message: 'The current working directory is not empty.', type: 'info' });

    throw new errors.DirectoryNotEmpty();
  }

  if (!await shell.which('git')) {
    progress({ message: 'git is not installed.', type: 'info' });

    throw new errors.ExecutableNotFound();
  }

  progress({ message: `Cloning ${template}...` });

  const branchOption = branch ? `--branch ${branch}` : '';

  try {
    await shell.exec(`git clone ${branchOption} ${url} .`, { silent: true, cwd: directory });
  } catch (ex) {
    progress({ message: `${ex.stderr}` });
    progress({ message: 'git failed to clone the template.', type: 'info' });

    throw ex;
  }

  await shell.rm('-rf', path.join(directory, '.git'));
};

module.exports = init;
