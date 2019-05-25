'use strict';

const defekt = require('defekt');

const errors = defekt([
  'DispatchFailed',
  'FileAlreadyExists',
  'FileNotFound',
  'ForwardFailed',
  'RequestFailed'
]);

module.exports = errors;
