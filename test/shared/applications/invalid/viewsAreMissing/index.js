'use strict';

const setupApplication = require('../../setupApplication');

const viewsIsMissing = async function () {
  const directory = await setupApplication({
    remove: [ 'server/views' ]
  });

  return directory;
};

module.exports = viewsIsMissing;
