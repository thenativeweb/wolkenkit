'use strict';

const get = require('lodash/get');

const hasAccess = function ({ user, to, authorizationOptions, isConstructor = false }) {
  if (!user) {
    throw new Error('User is missing.');
  }
  if (!to) {
    throw new Error('To is missing.');
  }
  if (!authorizationOptions) {
    throw new Error('Authorization options are missing.');
  }
  if (isConstructor === undefined) {
    throw new Error('Is constructor is missing.');
  }

  const authorizationOptionsForResource = get(authorizationOptions, to);

  if (!authorizationOptionsForResource) {
    throw new Error(`Resource '${to}' does not exist.`);
  }

  const { forAuthenticated, forPublic } = authorizationOptionsForResource;
  const { owner } = authorizationOptions;

  if (forPublic) {
    return true;
  }
  if (forAuthenticated && user.sub !== 'anonymous') {
    return true;
  }
  if (!isConstructor && user.sub === owner) {
    return true;
  }

  return false;
};

module.exports = hasAccess;
