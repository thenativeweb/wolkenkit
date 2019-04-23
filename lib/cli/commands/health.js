'use strict';

const buntstift = require('buntstift'),
      getUsage = require('command-line-usage'),
      processenv = require('processenv');

const defaults = require('../defaults.json'),
      globalOptionDefinitions = require('../globalOptionDefinitions'),
      showProgress = require('../showProgress'),
      wolkenkit = require('../../wolkenkit');

const health = {
  description: 'Verify whether wolkenkit is setup correctly.',

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
        { header: 'wolkenkit health', content: this.description },
        { header: 'Synopsis', content: 'wolkenkit health [--environment <env>]' },
        { header: 'Options', optionList: [ ...await this.getOptionDefinitions(), ...globalOptionDefinitions ]},
        { header: 'Remarks', content: `If you don't specify an environment, '${processenv('WOLKENKIT_ENV') || defaults.env}' will be used as default.` }
      ]));
    }

    buntstift.info(`Verifying health on environment ${env}...`);

    const stopWaiting = buntstift.wait();

    try {
      await wolkenkit.commands.health({
        directory,
        env
      }, showProgress(verbose, stopWaiting));
    } catch (ex) {
      stopWaiting();
      buntstift.error(`Failed to verify health on environment ${env}.`);

      throw ex;
    }

    stopWaiting();
    buntstift.success(`Verified health on environment ${env}.`);
  }
};

module.exports = health;
