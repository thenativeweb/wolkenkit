'use strict';

const setupApplication = require('../../setupApplication');

const withoutFlows = async function () {
  const directory = await setupApplication();

  return directory;
};

module.exports = withoutFlows;
