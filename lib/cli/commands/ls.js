'use strict';

const buntstift = require('buntstift'),
      getUsage = require('command-line-usage'),
      processenv = require('processenv');

const defaults = require('../defaults.json'),
      globalOptionDefinitions = require('../globalOptionDefinitions'),
      showProgress = require('../showProgress'),
      wolkenkit = require('../../wolkenkit');

const install = {
  description: 'List installed wolkenkit versions.',

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
        { header: 'wolkenkit ls', content: this.description },
        { header: 'Synopsis', content: 'wolkenkit ls [--env <env>]' },
        { header: 'Options', optionList: [ ...await this.getOptionDefinitions(), ...globalOptionDefinitions ]},
        { header: 'Remarks',
          content: [
            `If you don't specify an environment, '${processenv('WOLKENKIT_ENV') || defaults.env}' will be used as default.`
          ]
        }
      ]));
    }

    const stopWaiting = buntstift.wait();

    try {
      await wolkenkit.ls({ directory, env }, showProgress(verbose, stopWaiting));
    } catch (ex) {
      stopWaiting();
      buntstift.error('Failed to list installed wolkenkit versions.');

      throw ex;
    }

    stopWaiting();
  }
};

module.exports = install;
