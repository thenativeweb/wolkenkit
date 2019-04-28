'use strict';

const getConfiguration = function ({ application }) {
  if (!application) {
    throw new Error('Application is missing.');
  }

  const { writeModel, readModel } = application.configuration;

  return function (req, res) {
    res.send({ writeModel, readModel });
  };
};

module.exports = getConfiguration;
