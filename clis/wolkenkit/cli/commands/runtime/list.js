'use strict';

const buntstift = require('buntstift'),
      getUsage = require('command-line-usage'),
      processenv = require('processenv');

const defaults = require('../../defaults.json'),
      globalOptionDefinitions = require('../../globalOptionDefinitions'),
      showProgress = require('../../showProgress'),
      wolkenkit = require('../../../wolkenkit');

const list = {
  aliases: [ 'ls' ],

  description: 'List supported and installed wolkenkit versions.',

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
        { header: 'wolkenkit runtime list', content: this.description },
        { header: 'Synopsis', content: 'wolkenkit runtime ls [--env <env>]' },
        { header: 'Options', optionList: [ ...await this.getOptionDefinitions(), ...globalOptionDefinitions ]},
        {
          header: 'Remarks',
          content: [
            `If you don't specify an environment, '${processenv('WOLKENKIT_ENV') || defaults.env}' will be used as default.`
          ]
        }
      ]));
    }

    const stopWaiting = buntstift.wait();

    let versions;

    try {
      versions = await wolkenkit.commands.runtime.list({
        directory,
        env
      }, showProgress(verbose, stopWaiting));
    } catch (ex) {
      stopWaiting();
      buntstift.error('Failed to list supported and installed wolkenkit versions.');

      throw ex;
    }

    stopWaiting();
    buntstift.success(`There are ${versions.installed.length} of ${versions.supported.length} supported wolkenkit versions installed on environment ${env}.`);
  }
};

module.exports = list;
