'use strict';

const buntstift = require('buntstift'),
      getUsage = require('command-line-usage'),
      processenv = require('processenv'),
      stripIndent = require('common-tags/lib/stripIndent');

const defaults = require('../../defaults.json'),
      globalOptionDefinitions = require('../../globalOptionDefinitions'),
      showProgress = require('../../showProgress'),
      wolkenkit = require('../../../wolkenkit');

const restart = {
  description: 'Restart an infrastructure.',

  async getOptionDefinitions () {
    return [
      {
        name: 'dangerously-destroy-data',
        type: Boolean,
        defaultValue: defaults.commands.infrastructure.start.dangerouslyDestroyData,
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
        { header: 'wolkenkit infrastructure restart', content: this.description },
        { header: 'Synopsis', content: stripIndent`
          wolkenkit infrastructure restart [--env <env>] [--dangerously-destroy-data]` },
        { header: 'Options', optionList: [ ...await this.getOptionDefinitions(), ...globalOptionDefinitions ]}
      ]));
    }

    buntstift.info('Restarting the infrastructure...');

    const stopWaiting = buntstift.wait();

    try {
      await wolkenkit.commands.infrastructure.restart({
        dangerouslyDestroyData,
        directory,
        env
      }, showProgress(verbose, stopWaiting));
    } catch (ex) {
      stopWaiting();

      buntstift.error('Failed to restart the infrastructure.');

      throw ex;
    }

    stopWaiting();
    buntstift.success('Restarted the infrastructure.');
  }
};

module.exports = restart;
