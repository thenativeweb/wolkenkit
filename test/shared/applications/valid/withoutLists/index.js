'use strict';

const setupApplication = require('../../setupApplication');

const withoutLists = async function () {
  const directory = await setupApplication({
    remove: [ 'server/views/lists/*' ]
  });

  return directory;
};

module.exports = withoutLists;
