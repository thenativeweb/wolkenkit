'use strict';

const buntstift = require('buntstift'),
      getUsage = require('command-line-usage'),
      processenv = require('processenv'),
      stripIndent = require('common-tags/lib/stripIndent');

const defaults = require('../../defaults.json'),
      globalOptionDefinitions = require('../../globalOptionDefinitions'),
      showProgress = require('../../showProgress'),
      wolkenkit = require('../../../wolkenkit');

const stop = {
  description: 'Stop an infrastructure.',

  async getOptionDefinitions () {
    return [
      {
        name: 'dangerously-destroy-data',
        type: Boolean,
        defaultValue: defaults.commands.infrastructure.stop.dangerouslyDestroyData,
        description: 'destroy persistent data'
      },
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
    if (options['dangerously-destroy-data'] === undefined) {
      throw new Error('Dangerously destroy data is missing.');
    }
    if (!options.env) {
      throw new Error('Environment is missing.');
    }

    const directory = process.cwd(),
          { env, help, verbose } = options;

    const dangerouslyDestroyData = options['dangerously-destroy-data'];

    if (help) {
      return buntstift.info(getUsage([
        { header: 'wolkenkit infrastructure stop', content: this.description },
        { header: 'Synopsis', content: stripIndent`
          wolkenkit infrastructure stop [--env <env>] [--dangerously-destroy-data]` },
        { header: 'Options', optionList: [ ...await this.getOptionDefinitions(), ...globalOptionDefinitions ]}
      ]));
    }

    buntstift.info('Stopping the infrastructure...');

    const stopWaiting = buntstift.wait();

    try {
      await wolkenkit.commands.infrastructure.stop({
        dangerouslyDestroyData,
        directory,
        env
      }, showProgress(verbose, stopWaiting));
    } catch (ex) {
      stopWaiting();
      buntstift.error('Failed to stop the infrastructure.');

      throw ex;
    }

    stopWaiting();
    buntstift.success('Stopped the infrastructure.');
  }
};

module.exports = stop;
