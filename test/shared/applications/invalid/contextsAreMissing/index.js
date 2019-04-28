'use strict';

const setupApplication = require('../../setupApplication');

const contextsAreMissing = async function () {
  const directory = await setupApplication({
    remove: [ 'server/writeModel/*' ]
  });

  return directory;
};

module.exports = contextsAreMissing;
