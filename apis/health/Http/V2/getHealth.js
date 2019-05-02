'use strict';

const getHealth = function () {
  return function (req, res) {
    res.json({ api: 'v2' });
  };
};

module.exports = getHealth;
