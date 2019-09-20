'use strict';

const buntstift = require('buntstift'),
      semver = require('semver');

const askForDetails = async function ({ existingVersions }) {
  if (!existingVersions) {
    throw new Error('Existing versions are missing.');
  }
  if (!existingVersions.node) {
    throw new Error('Existing Node.js version is missing.');
  }

  const result = {};

  result.releaseType = await buntstift.select('wolkenkit release type:', [ 'patch', 'minor', 'major' ]);

  result.versions = {};
  result.versions.wolkenkit = semver.inc(existingVersions.wolkenkit, result.releaseType);
  result.versions.cli = semver.inc(existingVersions.cli, result.releaseType);
  result.versions.clientSdkJs = result.versions.wolkenkit;
  result.versions.depotClientSdkJs = result.versions.wolkenkit;

  buntstift.table([
    [ 'Component', 'Current', 'New' ],
    [],
    [ 'wolkenkit', existingVersions.wolkenkit, result.versions.wolkenkit ],
    [ 'CLI', existingVersions.cli, result.versions.cli ]
  ]);

  let wantsToProceed = await buntstift.confirm('Do you want to proceed with these versions?');

  if (!wantsToProceed) {
    throw new Error('Aborting release.');
  }

  buntstift.table([
    [ 'Browser', 'Version' ],
    [],
    [ 'Chrome', existingVersions.chrome ],
    [ 'Firefox', existingVersions.firefox ],
    [ 'Safari', existingVersions.safari ],
    [ 'Microsoft Edge', existingVersions.edge ],
    [ 'Internet Explorer', existingVersions.ie ],
    [ 'iOS', existingVersions.ios ],
    [ 'Android', existingVersions.android ]
  ]);

  wantsToProceed = await buntstift.confirm('Do you want to proceed with these browser versions?');

  if (!wantsToProceed) {
    throw new Error('Aborting release.');
  }

  result.versions.chrome = existingVersions.chrome;
  result.versions.firefox = existingVersions.firefox;
  result.versions.safari = existingVersions.safari;
  result.versions.edge = existingVersions.edge;
  result.versions.ie = existingVersions.ie;
  result.versions.ios = existingVersions.ios;
  result.versions.android = existingVersions.android;

  result.description = await buntstift.ask(`What's new? Start with 'The new version' and end with a '.':`, /^The new version .+\.$/ug);

  result.versions.node = await buntstift.ask('Node.js version:', { default: existingVersions.node, mask: /^\d+\.\d+\.\d+$/ug });
  result.versions.docker = await buntstift.ask('Docker version:', { default: existingVersions.docker, mask: /^\d{2}\.\d{2}$/ug });
  result.versions.vagrant = await buntstift.ask('Vagrant version:', { default: existingVersions.vagrant, mask: /^\d+\.\d+\.\d+$/ug });

  result.mode = await buntstift.select('Simulation or release:', [ 'simulation', 'release' ]);
  result.twitterHandles = [];

  if (result.mode === 'release') {
    /* eslint-disable no-constant-condition */
    while (true) {
      /* eslint-enable no-constant-condition */
      const twitterHandle = await buntstift.ask('Twitter handle of contributor (@name or empty to end):', /^$|^@.+$/ug);

      if (!twitterHandle) {
        break;
      }

      result.twitterHandles.push(twitterHandle);
    }

    const isSure = await buntstift.confirm(`Do you really want to release wolkenkit ${result.versions.wolkenkit} now?`, false);

    if (!isSure) {
      throw new Error('Aborting release.');
    }
  }

  return result;
};

module.exports = askForDetails;
