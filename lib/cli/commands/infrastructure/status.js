'use strict';

const buntstift = require('buntstift'),
      getUsage = require('command-line-usage'),
      processenv = require('processenv'),
      stripIndent = require('common-tags/lib/stripIndent');

const defaults = require('../../defaults.json'),
      globalOptionDefinitions = require('../../globalOptionDefinitions'),
      showProgress = require('../../showProgress'),
      wolkenkit = require('../../../wolkenkit');

const status = {
  description: 'Fetch an infrastructure status.',

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
        { header: 'wolkenkit infrastructure status', content: this.description },
        { header: 'Synopsis', content: stripIndent`
          wolkenkit infrastructure status [--env <env>]` },
        { header: 'Options', optionList: [ ...await this.getOptionDefinitions(), ...globalOptionDefinitions ]}
      ]));
    }

    buntstift.info('Fetching infrastructure status...');

    const stopWaiting = buntstift.wait();

    try {
      await wolkenkit.commands.infrastructure.status({
        directory,
        env
      }, showProgress(verbose, stopWaiting));
    } catch (ex) {
      stopWaiting();

      if (ex.code === 'EINFRASTRUCTURENOTRUNNING') {
        return buntstift.success('The infrastructure is stopped.');
      }
      if (ex.code === 'EINFRASTRUCTUREPARTIALLYRUNNING') {
        buntstift.error('The infrastructure is partially running.');
        throw ex;
      }

      buntstift.error('Failed to fetch infrastructure status.');
      throw ex;
    }

    stopWaiting();
    buntstift.success('The infrastructure is running.');
  }
};

module.exports = status;
