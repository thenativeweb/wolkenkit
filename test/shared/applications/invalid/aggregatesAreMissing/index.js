'use strict';

const setupApplication = require('../../setupApplication');

const aggregatesAreMissing = async function () {
  const directory = await setupApplication({
    remove: [ 'server/writeModel/sampleContext/*' ]
  });

  return directory;
};

module.exports = aggregatesAreMissing;
