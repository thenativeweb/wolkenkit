'use strict';

const _ = require('lodash');

const omitByDeep = function (obj, predicate) {
  if (!predicate) {
    throw new Error('Predicate is missing.');
  }

  if (!_.isObject(obj) || _.isArray(obj)) {
    return obj;
  }

  return _(obj).
    omitBy(predicate).
    mapValues(value => omitByDeep(value, predicate)).
    value();
};

module.exports = omitByDeep;
