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
  description: 'Stop an application.',

  async getOptionDefinitions () {
    return [
      {
        name: 'env',
        alias: 'e',
        type: String,
        defaultValue: processenv('WOLKENKIT_ENV') || defaults.env,
        description: 'select environment',
        typeLabel: '<env>'
      },
      {
        name: 'private-key',
        alias: 'k',
        type: String,
        description: 'select private key',
        typeLabel: '<file>'
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

    const privateKey = options['private-key'];

    if (help) {
      return buntstift.info(getUsage([
        { header: 'wolkenkit application stop', content: this.description },
        { header: 'Synopsis', content: stripIndent`
          wolkenkit application stop [--env <env>]
          wolkenkit application stop [--env <env>] [--private-key <file>]` },
        { header: 'Options', optionList: [ ...await this.getOptionDefinitions(), ...globalOptionDefinitions ]}
      ]));
    }

    buntstift.info('Stopping the application...');

    const stopWaiting = buntstift.wait();

    try {
      await wolkenkit.commands.application.stop({
        directory,
        env,
        privateKey
      }, showProgress(verbose, stopWaiting));
    } catch (ex) {
      stopWaiting();
      buntstift.error('Failed to stop the application.');

      throw ex;
    }

    stopWaiting();
    buntstift.success('Stopped the application.');
  }
};

module.exports = stop;
