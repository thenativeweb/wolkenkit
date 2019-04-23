'use strict';

const application = require('./application'),
      health = require('./health'),
      infrastructure = require('./infrastructure'),
      runtime = require('./runtime'),
      shared = require('./shared');

module.exports = { application, health, infrastructure, runtime, shared };
