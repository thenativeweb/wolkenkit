'use strict';

const { Collection } = require('mongodb');
const { getInfrastructure } = require('./getInfrastructure');
const { setupInfrastructure } = require('./setupInfrastructure');

module.exports = { setupInfrastructure, getInfrastructure };
