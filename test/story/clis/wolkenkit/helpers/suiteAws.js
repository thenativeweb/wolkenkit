'use strict';

const buntstift = require('buntstift'),
      measureTime = require('measure-time');

const getTest = require('./getTest'),
      getWolkenkit = require('./getWolkenkit'),
      setupAws = require('./setupAws'),
      teardownAws = require('./teardownAws');

/* eslint-disable no-redeclare */
const suiteAws = async function (description, fn) {
  /* eslint-enable no-redeclare */
  let ipAddress = process.argv[2];
  let mustRunTeardown = false;

  if (!ipAddress) {
    let ipAddresses;

    try {
      ipAddresses = await setupAws({ instanceCount: 1 });
    } catch (ex) {
      buntstift.info('Failed to set up AWS instance(s).');
      buntstift.error(ex.message);

      return;
    }

    [ ipAddress ] = ipAddresses;
    mustRunTeardown = true;
  }

  const teardown = async function () {
    try {
      await teardownAws({ instanceCount: 1 });
    } catch (ex) {
      buntstift.info('Failed to tear down AWS instance(s).');
      buntstift.error(ex.message);
    }
  };

  const test = await getTest({ description });
  const wolkenkit = await getWolkenkit({ ipAddress });

  const getElapsed = measureTime();

  try {
    await fn({ test, wolkenkit, ipAddress });
  } catch (ex) {
    buntstift.info(`${description} - failed.`);
    buntstift.error(ex.message);

    if (mustRunTeardown) {
      await teardown();
    }

    /* eslint-disable unicorn/no-process-exit */
    process.exit(1);
    /* eslint-enable unicorn/no-process-exit */
  }

  const elapsed = getElapsed();

  buntstift.success(`${description} - completed. (${elapsed.seconds}s)`);

  if (mustRunTeardown) {
    await teardown();
  }
};

module.exports = suiteAws;
