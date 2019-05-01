'use strict';

const getConfiguration = function ({ application }) {
  if (!application) {
    throw new Error('Application is missing.');
  }

  const { readModel } = application.configuration;

  return function (req, res) {
    res.send(readModel);
  };
};

module.exports = getConfiguration;
