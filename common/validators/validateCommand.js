'use strict';

const Value = require('validate-value');

const { Command } = require('../elements');

const validateCommand = function ({ command, application }) {
  if (!command) {
    throw new Error('Command is missing.');
  }
  if (!application) {
    throw new Error('Application is missing.');
  }

  if (!Command.isWellformed(command)) {
    throw new Error('Malformed command.');
  }

  const context = application.commands.internal[command.context.name];

  if (!context) {
    throw new Error('Invalid context name.');
  }

  const aggregate = context[command.aggregate.name];

  if (!aggregate) {
    throw new Error('Invalid aggregate name.');
  }

  if (!aggregate[command.name]) {
    throw new Error('Invalid command name.');
  }

  const { schema } = aggregate[command.name];

  if (!schema) {
    return;
  }

  const value = new Value(schema);

  value.validate(command.data, { valueName: 'command.data' });
};

module.exports = validateCommand;
