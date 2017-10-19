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
        name: 'server',
        alias: 's',
        type: String,
        defaultValue: processenv('WOLKENKIT_AUFWIND_SERVER') || 'http://localhost:7000',
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
    if (!options.server) {
      throw new Error('Server is missing.');
    }

    const directory = process.cwd(),
          { env, help, server, verbose } = options;

    if (help) {
      return buntstift.info(getUsage([
        { header: 'wolkenkit deploy', content: this.description },
        { header: 'Synopsis', content: 'wolkenkit deploy' },
        { header: 'Options', optionList: [ ...await this.getOptionDefinitions(), ...globalOptionDefinitions ]}
      ]));
    }

    buntstift.info(`Deploying wolkenkit...`);

    const stopWaiting = buntstift.wait();

    try {
      await wolkenkit.deploy({ env, directory, server }, showProgress(verbose, stopWaiting));
    } catch (ex) {
      stopWaiting();
      buntstift.error(`Failed to deploy wolkenkit.`);

      throw ex;
    }

    stopWaiting();
    buntstift.success(`Deployed wolkenkit.`);
  }
};

module.exports = deploy;
