'use strict';

const path = require('path');

const setupApplication = require('../../setupApplication');

const eventIsAuthorized = async function () {
  const directory = await setupApplication({
    copy: [ path.join(__dirname, 'data', '*') ]
  });

  return directory;
};

module.exports = eventIsAuthorized;
