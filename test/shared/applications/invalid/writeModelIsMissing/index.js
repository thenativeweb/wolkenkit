'use strict';

const setupApplication = require('../../setupApplication');

const writeModelIsMissing = async function () {
  const directory = await setupApplication({
    remove: [ 'server/writeModel' ]
  });

  return directory;
};

module.exports = writeModelIsMissing;
