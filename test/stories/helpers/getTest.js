'use strict';

const buntstift = require('buntstift'),
      isolated = require('isolated'),
      measureTime = require('measure-time');

const getTest = async function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.description) {
    throw new Error('Description is missing.');
  }

  const descriptionSuite = options.description;

  return async function (descriptionTest, fn) {
    if (!process.argv.includes('--verbose')) {
      process.argv.push('--verbose');
    }

    const directory = await isolated(),
          message = `${descriptionSuite} - ${descriptionTest}`;

    const getElapsed = measureTime();

    try {
      await fn({ directory });
    } catch (ex) {
      buntstift.error(message);
      buntstift.verbose(ex.stack || ex);

      throw ex;
    }

    const elapsed = getElapsed();

    buntstift.success(`${message} (${elapsed.seconds}s)`);
  };
};

module.exports = getTest;
