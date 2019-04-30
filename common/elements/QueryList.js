'use strict';

const Value = require('validate-value');

const value = new Value({
  type: 'object',
  properties: {
    list: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1, format: 'alphanumeric' }
      },
      required: [ 'name' ],
      additionalProperties: false
    },
    parameters: {
      type: 'object',
      properties: {
        where: {
          type: 'object',
          properties: {},
          required: [],
          additionalProperties: true
        },
        orderBy: {
          type: 'object',
          patternProperties: {
            '.*': {
              type: 'string',
              enum: [ 'asc', 'ascending', 'desc', 'descending' ]
            }
          },
          minProperties: 0,
          additionalProperties: false
        },
        skip: { type: 'number', minimum: 0 },
        take: { type: 'number', minimum: 1, maximum: 1000 }
      },
      required: [ 'where', 'orderBy', 'skip', 'take' ],
      additionalProperties: false
    }
  },
  required: [ 'list', 'parameters' ],
  additionalProperties: false
});

class QueryList {
  constructor ({ list, parameters }) {
    if (!list) {
      throw new Error('List is missing.');
    }
    if (!list.name) {
      throw new Error('List name is missing.');
    }
    if (!parameters) {
      throw new Error('Parameters are missing.');
    }
    if (!parameters.where) {
      throw new Error('Where is missing.');
    }
    if (!parameters.orderBy) {
      throw new Error('Order by is missing.');
    }
    if (parameters.skip === undefined) {
      throw new Error('Skip is missing.');
    }
    if (parameters.take === undefined) {
      throw new Error('Take is missing.');
    }

    this.list = { name: list.name };
    this.parameters = {
      where: parameters.where,
      orderBy: parameters.orderBy,
      skip: parameters.skip,
      take: parameters.take
    };

    value.validate(this, { valueName: 'queryList' });
  }

  static deserialize ({ list, parameters }) {
    const queryList = new QueryList({ list, parameters });

    return queryList;
  }

  static isWellformed (queryList) {
    if (!queryList) {
      return false;
    }

    return value.isValid(queryList);
  }
}

module.exports = QueryList;
