'use strict';

const setupApplication = require('../../setupApplication');

const contextsAreMissing = async function () {
  const directory = await setupApplication({
    remove: [ 'server/domain/*' ]
  });

  return directory;
};

module.exports = contextsAreMissing;
