#!/usr/bin/env node

'use strict';

require('babel-polyfill');

const buntstift = require('buntstift'),
      commandLineArgs = require('command-line-args'),
      commandLineCommands = require('command-line-commands'),
      findSuggestions = require('findsuggestions');

const commands = require('../cli/commands'),
      globalOptionDefinitions = require('../cli/globalOptionDefinitions');

(async function () {
  const validCommands = Object.keys(commands);

  let parsed;

  try {
    parsed = commandLineCommands([ null, ...validCommands ]);
  } catch (ex) {
    const suggestions = findSuggestions({ for: ex.command, in: validCommands });

    buntstift.error(`Unknown command '${ex.command}', did you mean '${suggestions[0].suggestion}'?`);
    buntstift.exit(1);
  }

  if (!parsed.command) {
    parsed.command = 'help';
  }

  const command = commands[parsed.command];
  const validOptionDefinitions = [ ...globalOptionDefinitions, ...await command.getOptionDefinitions() ];

  const args = commandLineArgs(validOptionDefinitions, { argv: parsed.argv, partial: true });

  /* eslint-disable no-underscore-dangle */
  if (args._unknown && args._unknown.length > 0) {
    buntstift.error(`Unknown argument '${args._unknown[0]}'.`);
    buntstift.exit(1);
  }
  /* eslint-enable no-underscore-dangle */

  try {
    await command.run(args);
  } catch (ex) {
    if (ex.message) {
      buntstift.verbose(ex.message);
    }
    if (ex.stack) {
      buntstift.verbose(ex.stack);
    }
    buntstift.exit(1);
  }

  buntstift.exit(0);
})();
