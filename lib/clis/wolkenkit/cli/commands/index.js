'use strict';

const kebabCase = require('lodash/kebabCase'),
      mapKeys = require('lodash/mapKeys'),
      requireDir = require('require-dir');

const application = require('./application'),
      infrastructure = require('./infrastructure'),
      runtime = require('./runtime');

const commands = mapKeys(
  { application, infrastructure, runtime, ...requireDir(__dirname) },
  (value, key) => kebabCase(key)
);

module.exports = commands;
