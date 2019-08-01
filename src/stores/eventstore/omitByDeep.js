'use strict';

const _ = require('lodash'),
      isArray = require('lodash/isArray'),
      isObject = require('lodash/isObject');

const omitByDeep = function (obj, predicate) {
  if (!predicate) {
    throw new Error('Predicate is missing.');
  }

  if (!isObject(obj) || isArray(obj)) {
    return obj;
  }

  return _(obj).
    omitBy(predicate).
    mapValues(value => omitByDeep(value, predicate)).
    value();
};

module.exports = omitByDeep;
