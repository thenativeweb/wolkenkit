'use strict';

const noop = require('../../../noop'),
      runtimes = require('../../runtimes');

const lsRemote = async function (progress = noop) {
  const versions = await runtimes.getAllVersions();

  progress({ message: 'Available wolkenkit versions:', type: 'info' });

  versions.forEach(version => {
    progress({ message: version, type: 'list' });
  });
};

module.exports = lsRemote;
