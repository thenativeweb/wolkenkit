'use strict';

const getCommandNames = function (commands) {
  const commandNames = [];

  for (const [ command, commandDefinition ] of Object.entries(commands)) {
    commandNames.push(command);

    if (!commandDefinition.aliases || commandDefinition.aliases.length === 0) {
      continue;
    }

    for (const alias of commandDefinition.aliases) {
      commandNames.push(alias);
    }
  }

  return commandNames;
};

module.exports = getCommandNames;
