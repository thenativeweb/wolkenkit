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
    const commands = require('.');
    /* eslint-enable global-require */

    buntstift.info(getUsage([
      { header: 'wolkenkit', content: 'Manages wolkenkit.' },
      { header: 'Synopsis', content: 'wolkenkit <command> [options]' },
      {
        header: 'Commands',
        content: Object.keys(commands).
          map(command => ({
            name: command,
            description: commands[command].description
          })).
          filter(command => command.description)
      }
    ]));
  }
};

module.exports = help;
