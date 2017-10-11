'use strict';

const getLatestVersion = require('./getLatestVersion'),
      getNumberedVersions = require('./getNumberedVersions');

const getAllVersions = async function () {
  const latestVersion = await getLatestVersion(),
        numberedVersions = await getNumberedVersions();

  const versions = [ latestVersion, ...numberedVersions ];

  return versions;
};

module.exports = getAllVersions;
