'use strict';

const { Command } = require('../../../../common/elements');

const validateCommand = function ({ command, application }) {
  if (!command) {
    throw new Command('Command is missing.');
  }
  if (!application) {
    throw new Command('Application is missing.');
  }

  if (!Command.isWellformed(command)) {
    throw new Error('Malformed command.');
  }

  const { writeModel } = application.configuration;
  const context = writeModel[command.context.name];

  if (!context) {
    throw new Error('Unknown context name.');
  }

  const aggregate = context[command.aggregate.name];

  if (!aggregate) {
    throw new Error('Unknown aggregate name.');
  }

  if (!aggregate.commands || !aggregate.commands[command.name]) {
    throw new Error('Unknown command name.');
  }
};

module.exports = validateCommand;
