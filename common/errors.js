'use strict';

const defekt = require('defekt');

const errors = defekt([
  'FileAlreadyExists',
  'FileNotFound'
]);

module.exports = errors;
