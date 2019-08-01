'use strict';

const execLive = require('./execLive');

const isInstalled = async function (application) {
  try {
    await execLive(`command -v ${application}`, { silent: true });

    return true;
  } catch {
    return false;
  }
};

module.exports = isInstalled;
