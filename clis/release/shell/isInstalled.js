'use strict';

const execLive = require('./execLive');

const isInstalled = async function (application) {
  try {
    await execLive(`command -v ${application}`, { silent: true });

    return true;
  } catch (ex) {
    return false;
  }
};

module.exports = isInstalled;
