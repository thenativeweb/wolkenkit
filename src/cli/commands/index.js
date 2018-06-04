'use strict';

const kebabCase = require('lodash/kebabCase'),
      mapKeys = require('lodash/mapKeys'),
      requireDir = require('require-dir');

module.exports = mapKeys(requireDir(__dirname), (value, key) => kebabCase(key));
