#!/usr/bin/env node

'use strict';

const buntstift = require('buntstift'),
      commandLineArgs = require('command-line-args'),
      commandLineCommands = require('command-line-commands'),
      findSuggestions = require('findsuggestions'),
      updateNotifier = require('update-notifier');

const commands = require('../lib/cli/commands'),
      getCommand = require('../lib/cli/getCommand'),
      getCommandNames = require('../lib/cli/getCommandNames'),
      globalOptionDefinitions = require('../lib/cli/globalOptionDefinitions'),
      packageJson = require('../package.json'),
      telemetry = require('../lib/telemetry');

updateNotifier({ pkg: packageJson }).notify();

(async function () {
  const validCommands = getCommandNames(commands);

  let parsed;

  try {
    parsed = commandLineCommands([ null, ...validCommands ]);
  } catch (ex) {
    const commandSuggestions = findSuggestions({ for: ex.command, in: validCommands });

    buntstift.error(`Unknown command '${ex.command}', did you mean '${commandSuggestions[0].suggestion}'?`);
    buntstift.exit(1);
  }

  if (!parsed.command) {
    if (parsed.argv.length > 0 && parsed.argv.includes('--version')) {
      buntstift.info(packageJson.version);
      buntstift.exit(0);
    }

    parsed.command = 'help';
  }

  const commandName = parsed.command;
  const command = getCommand(commands, commandName);

  let subCommand,
      subCommandName;

  if (command.subCommands) {
    const validSubCommands = getCommandNames(command.subCommands);

    subCommandName = (parsed.argv[0] || 'help').replace('--', '');
    subCommand = getCommand(command.subCommands, subCommandName);

    if (!subCommand) {
      const subCommandSuggestions = findSuggestions({ for: subCommandName, in: validSubCommands });

      buntstift.error(`Unknown command '${subCommandName}', did you mean '${subCommandSuggestions[0].suggestion}'?`);
      buntstift.exit(1);
    }

    parsed.argv.shift();
  }

  let validOptionDefinitions = [ ...globalOptionDefinitions ];

  if (subCommand) {
    validOptionDefinitions = [
      ...validOptionDefinitions,
      ...await subCommand.getOptionDefinitions()
    ];
  } else {
    validOptionDefinitions = [
      ...validOptionDefinitions,
      ...await command.getOptionDefinitions()
    ];
  }

  const args = commandLineArgs(validOptionDefinitions, {
    argv: parsed.argv,
    partial: true
  });

  /* eslint-disable no-underscore-dangle */
  if (args._unknown && args._unknown.length > 0) {
    buntstift.error(`Unknown argument '${args._unknown[0]}'.`);
    buntstift.exit(1);
  }
  /* eslint-enable no-underscore-dangle */

  const handleException = function (ex) {
    // In case of an exception, always enable verbose mode so that the exception
    // details are shown.
    if (!process.argv.includes('--verbose')) {
      process.argv.push('--verbose');
    }

    if (ex.message) {
      buntstift.verbose(ex.message);
    }
    if (ex.stack) {
      buntstift.verbose(ex.stack);
    }
    buntstift.exit(1);
  };

  process.on('uncaughtException', handleException);
  process.on('unhandledRejection', handleException);

  await telemetry.init();

  try {
    if (subCommand) {
      await subCommand.run(args);
    } else {
      await command.run(args);
    }

    await telemetry.send({
      command: subCommandName ? `${commandName} ${subCommandName}` : commandName,
      args
    });
  } catch (ex) {
    handleException(ex);
  }

  buntstift.exit(0);
})();
