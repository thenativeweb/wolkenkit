'use strict';

const buntstift = require('buntstift'),
      eslint = require('eslint'),
      getUsage = require('command-line-usage'),
      processenv = require('processenv');

const defaults = require('../defaults.json'),
      globalOptionDefinitions = require('../globalOptionDefinitions'),
      showProgress = require('../showProgress'),
      wolkenkit = require('../../wolkenkit');

const reload = {
  description: 'Reload an application.',

  async getOptionDefinitions () {
    return [
      {
        name: 'env',
        alias: 'e',
        type: String,
        defaultValue: processenv('WOLKENKIT_ENV') || defaults.env,
        description: 'select environment',
        typeLabel: '<env>'
      }
    ];
  },

  async run (options) {
    if (!options) {
      throw new Error('Options are missing.');
    }
    if (!options.env) {
      throw new Error('Environment is missing.');
    }

    const directory = process.cwd(),
          { env, help, verbose } = options;

    if (help) {
      return buntstift.info(getUsage([
        { header: 'wolkenkit reload', content: this.description },
        { header: 'Synopsis', content: 'wolkenkit reload [--env <env>]' },
        { header: 'Options', optionList: [ ...await this.getOptionDefinitions(), ...globalOptionDefinitions ]}
      ]));
    }

    buntstift.info('Reloading the application...');

    const stopWaiting = buntstift.wait();

    try {
      await wolkenkit.commands.reload({
        directory,
        env
      }, showProgress(verbose, stopWaiting));
    } catch (ex) {
      stopWaiting();

      if (ex.code === 'ECODEMALFORMED') {
        const formatter = eslint.CLIEngine.getFormatter();

        const formattedResult = formatter(ex.cause.results);
        const output = formattedResult.
          split('\n').
          slice(0, -2).
          join('\n');

        buntstift.info(output);
        buntstift.info(ex.message);
      }

      buntstift.error('Failed to reload the application.');

      throw ex;
    }

    stopWaiting();
    buntstift.success('Reloaded the application.');
  }
};

module.exports = reload;
