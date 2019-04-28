'use strict';

const setupApplication = require('../../setupApplication');

const readModelIsMissing = async function () {
  const directory = await setupApplication({
    remove: [ 'server/readModel' ]
  });

  return directory;
};

module.exports = readModelIsMissing;
