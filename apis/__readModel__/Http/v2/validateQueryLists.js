'use strict';

const Value = require('validate-value');

const validateQueryLists = function (query) {
  if (!query) {
    throw new Error('Query is missing.');
  }

  const value = new Value({
    type: 'object',
    properties: {
      skip: { type: 'number', minimum: 0 },
      take: { type: 'number', minimum: 1 },
      where: { type: 'object', additionalProperties: true },
      orderBy: {
        type: 'object',
        additionalProperties: {
          type: 'string',
          enum: [ 'asc', 'ascending', 'desc', 'descending' ]
        }
      }
    },
    additionalProperties: false
  });

  const isValid = value.isValid(query);

  if (!isValid) {
    throw new Error('Invalid query.');
  }
};

module.exports = validateQueryLists;
