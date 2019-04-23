'use strict';

const globalOptionDefinitions = [
  {
    name: 'verbose',
    type: Boolean,
    defaultValue: false,
    description: 'show detailed output'
  }, {
    name: 'help',
    alias: 'h',
    type: Boolean,
    defaultValue: false,
    description: 'show help'
  }
];

module.exports = globalOptionDefinitions;
