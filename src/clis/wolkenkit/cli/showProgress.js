'use strict';

const buntstift = require('buntstift');

const showProgress = function (verbose, stopWaiting) {
  if (verbose === undefined) {
    throw new Error('Verbose is missing.');
  }
  if (!stopWaiting) {
    throw new Error('Stop waiting is missing.');
  }

  let stopWaitingInternal = stopWaiting;

  return function (progress) {
    if (!progress) {
      throw new Error('Progress is missing.');
    }
    if (!progress.message) {
      throw new Error('Message is missing.');
    }

    const type = progress.type || 'verbose';
    const indent = progress.indent || 0;

    const spinnerRequiresPause =
      stopWaitingInternal &&
      (type !== 'verbose' || verbose);

    if (spinnerRequiresPause) {
      stopWaitingInternal();
    }

    buntstift[type](progress.message.trim(), { indent });

    if (spinnerRequiresPause) {
      stopWaitingInternal = buntstift.wait();
    }
  };
};

module.exports = showProgress;
