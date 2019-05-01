'use strict';

const getStatus = function () {
  return function (req, res) {
    res.json({ api: 'v2' });
  };
};

module.exports = getStatus;
