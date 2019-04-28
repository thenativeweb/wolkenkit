'use strict';

const setupApplication = require('../../setupApplication');

const flowsAreMissing = async function () {
  const directory = await setupApplication({
    remove: [ 'server/flows' ]
  });

  return directory;
};

module.exports = flowsAreMissing;
