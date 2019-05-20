'use strict';

const errors = require('../../../errors'),
      runtimes = require('../../../runtimes'),
      shell = require('../../../shell');

const cloneRepository = async function ({ directory, template }, progress) {
  if (!directory) {
    throw new Error('Directory is missing.');
  }
  if (!template) {
    throw new Error('Template is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const latestStableVersion = await runtimes.getLatestStableVersion();
  const wolkenkitUrl = `https://docs.wolkenkit.io/${latestStableVersion}/getting-started/installing-wolkenkit/verifying-system-requirements/`;

  const matches = template.match(/^(?<protocol>(?:git:|ssh:|https:\/\/|git@[\w.]+)[\w.@:/~_-]+(?:\.git)?\/?)(?:#(?<commitId>[a-zA-Z0-9/.\-_]+))?$/u);

  if (!matches) {
    progress({ message: 'Malformed url.', type: 'info' });

    throw new errors.UrlMalformed();
  }

  if (!await shell.which('git')) {
    progress({ message: `git is not installed (see ${wolkenkitUrl} for how to install wolkenkit).`, type: 'info' });

    throw new errors.ExecutableNotFound();
  }

  const [ , url, branch ] = matches;
  const branchOption = branch ? `--branch ${branch}` : '';

  progress({ message: `Cloning ${template}...`, type: 'info' });

  try {
    await shell.exec(`git clone ${branchOption} ${url} .`, {
      silent: true,
      cwd: directory
    });
  } catch (ex) {
    progress({ message: `${ex.stderr}` });
    progress({ message: 'git failed to clone the template.', type: 'info' });

    throw ex;
  }
};

module.exports = cloneRepository;
