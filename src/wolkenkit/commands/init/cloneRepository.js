'use strict';

const errors = require('../../../errors'),
      shell = require('../../../shell');

const cloneRepository = async function (options, progress) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.directory) {
    throw new Error('Directory is missing.');
  }
  if (!options.template) {
    throw new Error('Template is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const { directory, template } = options;

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

  progress({ message: `Cloning ${template}...` });

  try {
    await shell.exec(`git clone ${branchOption} ${url} .`, { silent: true, cwd: directory });
  } catch (ex) {
    progress({ message: `${ex.stderr}` });
    progress({ message: 'git failed to clone the template.', type: 'info' });

    throw ex;
  }
};

module.exports = cloneRepository;
