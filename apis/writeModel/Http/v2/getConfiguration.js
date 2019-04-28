'use strict';

const getConfiguration = function ({ application }) {
  if (!application) {
    throw new Error('Application is missing.');
  }

  const { writeModel } = application.configuration;

  return function (req, res) {
    res.send(writeModel);
  };
};

module.exports = getConfiguration;
