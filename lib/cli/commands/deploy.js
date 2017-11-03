'use strict';

const buntstift = require('buntstift'),
      getUsage = require('command-line-usage'),
      processenv = require('processenv');

const defaults = require('../defaults'),
      globalOptionDefinitions = require('../globalOptionDefinitions'),
      showProgress = require('../showProgress'),
      wolkenkit = require('../../wolkenkit');

const deploy = {
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
        alias: 'p',
        type: String,
        description: 'select private key',
        typeLabel: '<file>'
      },
      {
        name: 'server',
        alias: 's',
        type: String,
        defaultValue: processenv('WOLKENKIT_AUFWIND_SERVER') || 'ssh://localhost:6000',
        description: 'select server',
        typeLabel: '<server>'
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
    if (!options.server) {
      throw new Error('Server is missing.');
    }

    const directory = process.cwd(),
          { env, help, server, verbose } = options,
          privateKey = options['private-key'];

    if (help) {
      return buntstift.info(getUsage([
        { header: 'wolkenkit deploy', content: this.description },
        { header: 'Synopsis', content: 'wolkenkit deploy' },
        { header: 'Options', optionList: [ ...await this.getOptionDefinitions(), ...globalOptionDefinitions ]}
      ]));
    }

    buntstift.info('Deploying application...');

    const stopWaiting = buntstift.wait();

    try {
      await wolkenkit.deploy({ env, directory, privateKey, server }, showProgress(verbose, stopWaiting));
    } catch (ex) {
      stopWaiting();
      buntstift.error('Failed to deploy application.');

      throw ex;
    }

    stopWaiting();
    buntstift.success('Deployed application.');
  }
};

module.exports = deploy;
