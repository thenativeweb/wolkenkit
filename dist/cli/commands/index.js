'use strict';

var kebabCase = require('lodash/kebabCase'),
    mapKeys = require('lodash/mapKeys'),
    requireDir = require('require-dir');

module.exports = mapKeys(requireDir(__dirname), function (value, key) {
  return kebabCase(key);
});