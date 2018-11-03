'use strict';

const errors = require('../../../errors'),
      shell = require('../../../shell'),
      runtimes = require('../../runtimes');

const cloneRepository = async function (options, progress) {
  console.log(runtimes);
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

  const latestStableVersion = await runtimes.getLatestStableVersion();

  const wolkenkitUrl = `https://docs.wolkenkit.io/${latestStableVersion}/getting-started/installing-wolkenkit/verifying-system-requirements/`

  const matches = template.match(/^((?:git:|ssh:|https:\/\/|git@[\w.]+)[\w.@:/~_-]+(?:\.git)?\/?)(?:#([a-zA-Z0-9/.\-_]+))?$/);

  if (!matches) {
    progress({ message: 'Malformed url.', type: 'info' });

    throw new errors.UrlMalformed();
  }

  if (!await shell.which('git')) {
    progress({ message: `Git is not installed. (see ${wolkenkitUrl} for how to install wolkenkit.)`, type: 'info' });

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
