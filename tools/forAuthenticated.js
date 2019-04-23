'use strict';

const forAuthenticated = function () {
  return function (resource, action, { client }) {
    return client.user.id !== 'anonymous';
  };
};

module.exports = forAuthenticated;
