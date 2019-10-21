'use strict';

const fs = require('fs'),
      path = require('path'),
      { promisify } = require('util');

const semver = require('semver');

const readdir = promisify(fs.readdir);

const getNumberedVersions = async function () {
  const entries = await readdir(path.join(__dirname, '..', '..', 'configuration'));

  const versions = entries.
    filter(version => semver.valid(version)).
    sort((versionA, versionB) => semver.lt(versionA, versionB));

  return versions;
};

module.exports = getNumberedVersions;
