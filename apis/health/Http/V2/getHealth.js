'use strict';

const getHealth = function ({ processId }) {
  if (!processId) {
    throw new Error('Process id is missing.');
  }

  return function (req, res) {
    res.json({ processId });
  };
};

module.exports = getHealth;
