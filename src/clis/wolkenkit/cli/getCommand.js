'use strict';

const getCommand = function (commands, commandName) {
  for (const [ command, commandDefinition ] of Object.entries(commands)) {
    if (command === commandName) {
      return commandDefinition;
    }

    if (!commandDefinition.aliases || commandDefinition.aliases.length === 0) {
      continue;
    }

    if (commandDefinition.aliases.includes(commandName)) {
      return commandDefinition;
    }
  }
};

module.exports = getCommand;
