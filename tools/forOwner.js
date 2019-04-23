'use strict';

const forOwner = function () {
  return function (resource, action, { client }) {
    return resource.state.owner === client.user.id;
  };
};

module.exports = forOwner;
