'use strict';

const buntstift = require('buntstift');

const showProgress = function (verbose, stopWaiting) {
  if (verbose === undefined) {
    throw new Error('Verbose is missing.');
  }
  if (!stopWaiting) {
    throw new Error('Stop waiting is missing.');
  }

  return function (progress) {
    if (!progress) {
      throw new Error('Progress is missing.');
    }
    if (!progress.message) {
      throw new Error('Message is missing.');
    }

    progress.type = progress.type || 'verbose';

    const spinnerRequiresPause = stopWaiting && (progress.type !== 'verbose' || verbose);

    if (spinnerRequiresPause) {
      stopWaiting();
    }

    buntstift[progress.type](progress.message.trim());

    if (spinnerRequiresPause) {
      stopWaiting = buntstift.wait();
    }
  };
};

module.exports = showProgress;
