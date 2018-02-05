'use strict';

const buntstift = require('buntstift'),
      getUsage = require('command-line-usage');

const defaults = require('../defaults.json'),
      globalOptionDefinitions = require('../globalOptionDefinitions'),
      showProgress = require('../showProgress'),
      wolkenkit = require('../../wolkenkit');

const init = {
  description: 'Initialize a new application.',

  async getOptionDefinitions () {
    return [
      {
        name: 'template',
        alias: 't',
        type: String,
        defaultValue: defaults.commands.init.template,
        description: 'template to clone',
        typeLabel: '<url>'
      },
      {
        name: 'force',
        alias: 'f',
        type: Boolean,
        defaultValue: defaults.commands.init.force,
        description: 'force overwriting files'
      }
    ];
  },

  async run (options) {
    if (!options) {
      throw new Error('Options are missing.');
    }
    if (!options.template) {
      throw new Error('Template is missing.');
    }
    if (options.force === undefined) {
      throw new Error('Force is missing.');
    }

    const directory = process.cwd(),
          { help, verbose, template, force } = options;

    if (help) {
      return buntstift.info(getUsage([
        { header: 'wolkenkit init', content: this.description },
        { header: 'Synopsis', content: 'wolkenkit init [--template <url>] [--force]' },
        { header: 'Options', optionList: [ ...await this.getOptionDefinitions(), ...globalOptionDefinitions ]},
        { header: 'Remarks', content: `If you don't specify a template, ${defaults.commands.init.template} will be used as default.` }
      ]));
    }

    buntstift.info('Initializing a new application...');

    const stopWaiting = buntstift.wait();

    try {
      await wolkenkit.init({ directory, template, force }, showProgress(verbose, stopWaiting));
    } catch (ex) {
      stopWaiting();
      buntstift.error('Failed to initialize a new application.');

      throw ex;
    }

    stopWaiting();
    buntstift.success('Initialized a new application.');
  }
};

module.exports = init;
