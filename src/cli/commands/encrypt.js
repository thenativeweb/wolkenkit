'use strict';

const buntstift = require('buntstift'),
      getUsage = require('command-line-usage'),
      processenv = require('processenv');

const defaults = require('../defaults'),
      globalOptionDefinitions = require('../globalOptionDefinitions'),
      showProgress = require('../showProgress'),
      wolkenkit = require('../../wolkenkit');

const encrypt = {
  description: 'Encrypt the given value.',

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
      },
      {
        name: 'value',
        alias: 'v',
        type: String,
        description: 'select value',
        typeLabel: '<value>'
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
          { env, help, value, verbose } = options,
          privateKey = options['private-key'];

    if (help) {
      return buntstift.info(getUsage([
        { header: 'wolkenkit encrypt', content: this.description },
        { header: 'Synopsis', content: 'wolkenkit encrypt [--value <value>] [--env <env>] [--private-key <file>]' },
        { header: 'Options', optionList: [ ...await this.getOptionDefinitions(), ...globalOptionDefinitions ]}
      ]));
    }

    buntstift.info('Encrypting...');

    if (!options.value) {
      buntstift.error('Value is missing.');

      throw new Error('Value is missing.');
    }

    const stopWaiting = buntstift.wait();

    let encrypted;

    try {
      encrypted = await wolkenkit.commands.encrypt({ env, directory, privateKey, value }, showProgress(verbose, stopWaiting));
    } catch (ex) {
      stopWaiting();
      buntstift.error('Failed to encrypt.');

      throw ex;
    }

    stopWaiting();
    buntstift.success(`Value: ${encrypted}`);
  }
};

module.exports = encrypt;
