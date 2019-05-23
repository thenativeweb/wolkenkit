'use strict';

const defekt = require('defekt');

const errors = defekt([
  'DispatchFailed',
  'FileAlreadyExists',
  'FileNotFound',
  'RequestFailed'
]);

module.exports = errors;
