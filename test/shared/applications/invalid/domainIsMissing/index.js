'use strict';

const setupApplication = require('../../setupApplication');

const domainIsMissing = async function () {
  const directory = await setupApplication({
    remove: [ 'server/domain' ]
  });

  return directory;
};

module.exports = domainIsMissing;
