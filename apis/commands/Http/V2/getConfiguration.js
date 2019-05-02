'use strict';

const getConfiguration = function ({ application }) {
  if (!application) {
    throw new Error('Application is missing.');
  }

  const commands = application.commands.external;

  return function (req, res) {
    res.send(commands);
  };
};

module.exports = getConfiguration;
