'use strict';

const getConfiguration = function ({ application }) {
  if (!application) {
    throw new Error('Application is missing.');
  }

  const events = application.events.external;

  return function (req, res) {
    res.send(events);
  };
};

module.exports = getConfiguration;
