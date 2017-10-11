'use strict';

const semver = require('semver');

const getNumberedVersions = require('./getNumberedVersions');

const getLatestStableVersion = async function () {
  let latestStableVersion = '0.0.0';

  const versions = await getNumberedVersions();

  versions.forEach(version => {
    if (!semver.valid(version)) {
      return;
    }
    if (!semver.gt(version, latestStableVersion)) {
      return;
    }

    latestStableVersion = version;
  });

  return latestStableVersion;
};

module.exports = getLatestStableVersion;
