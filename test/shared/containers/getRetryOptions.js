'use strict';

const getRetryOptions = function () {
  return {
    retries: 10,
    factor: 2,
    minTimeout: 500,
    maxTimeout: 5000
  };
};

module.exports = getRetryOptions;
