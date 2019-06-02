'use strict';

const Value = require('validate-value');

const getSchema = require('./getSchema');

const isValid = function (isAuthorized) {
  if (!isAuthorized) {
    throw new Error('Is authorized is missing.');
  }

  const schema = getSchema();
  const value = new Value(schema);

  const isAuthorizedValid = value.isValid(isAuthorized);

  return isAuthorizedValid;
};

module.exports = isValid;
