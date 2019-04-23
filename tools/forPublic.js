'use strict';

const forPublic = function () {
  return function () {
    return true;
  };
};

module.exports = forPublic;
