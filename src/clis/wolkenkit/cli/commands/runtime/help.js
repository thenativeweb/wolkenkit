'use strict';

const buntstift = require('buntstift'),
      getUsage = require('command-line-usage');

const help = {
  description: 'Show the help.',

  async getOptionDefinitions () {
    return [];
  },

  async run () {
    // Since we have a cyclic dependency here, we need to call this require
    // at runtime, not at load-time.

    /* eslint-disable global-require */
    const { subCommands } = require('.');
    /* eslint-enable global-require */

    buntstift.info(getUsage([
      { header: 'wolkenkit runtime', content: 'Manages runtime versions.' },
      { header: 'Synopsis', content: 'wolkenkit runtime <command> [options]' },
      {
        header: 'Commands',
        content: Object.keys(subCommands).
          map(subCommand => ({
            name: subCommand,
            description: subCommands[subCommand].description
          })).
          filter(subCommand => subCommand.description)
      }
    ]));
  }
};

module.exports = help;
