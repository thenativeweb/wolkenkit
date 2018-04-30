'use strict';

const buntstift = require('buntstift'),
      getUsage = require('command-line-usage'),
      processenv = require('processenv'),
      stripIndent = require('common-tags/lib/stripIndent');

const defaults = require('../defaults.json'),
      errors = require('../../errors'),
      globalOptionDefinitions = require('../globalOptionDefinitions'),
      showProgress = require('../showProgress'),
      wolkenkit = require('../../wolkenkit');

const status = {
  description: 'Fetch an application status.',

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
          { env, help, privateKey, verbose } = options;

    if (help) {
      return buntstift.info(getUsage([
        { header: 'wolkenkit status', content: this.description },
        { header: 'Synopsis', content: stripIndent`
          wolkenkit status [--env <env>]
          wolkenkit status [--env <env>] [--private-key <file>]` },
        { header: 'Options', optionList: [ ...await this.getOptionDefinitions(), ...globalOptionDefinitions ]}
      ]));
    }

    buntstift.info('Fetching application status...');

    const stopWaiting = buntstift.wait();

    try {
      await wolkenkit.commands.status({ directory, env, privateKey }, showProgress(verbose, stopWaiting));
    } catch (ex) {
      stopWaiting();

      if (ex instanceof errors.ApplicationNotRunning) {
        return buntstift.success('The application is stopped.');
      }
      if (ex instanceof errors.ApplicationPartiallyRunning) {
        buntstift.error('The application is partially running.');
        throw ex;
      }

      buntstift.error('Failed to fetch application status .');
      throw ex;
    }

    stopWaiting();
    buntstift.success('The application is running.');
  }
};

module.exports = status;
