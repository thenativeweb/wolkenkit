'use strict';

const buntstift = require('buntstift'),
      getUsage = require('command-line-usage');

const globalOptionDefinitions = require('../globalOptionDefinitions'),
      showProgress = require('../showProgress'),
      wolkenkit = require('../../wolkenkit');

const update = {
  description: 'Update the wolkenkit CLI (deprecated, use npm instead).',

  async getOptionDefinitions () {
    return [];
  },

  async run (options) {
    if (!options) {
      throw new Error('Options are missing.');
    }

    const { help, verbose } = options;

    if (help) {
      return buntstift.info(getUsage([
        { header: 'wolkenkit update', content: this.description },
        { header: 'Synopsis', content: 'wolkenkit update' },
        { header: 'Options', optionList: [ ...await this.getOptionDefinitions(), ...globalOptionDefinitions ]}
      ]));
    }

    buntstift.info('Updating the wolkenkit CLI...');

    const stopWaiting = buntstift.wait();

    try {
      await wolkenkit.commands.update(showProgress(verbose, stopWaiting));
    } catch (ex) {
      stopWaiting();

      if (ex.code === 'EVERSIONALREADYINSTALLED') {
        buntstift.success('The latest wolkenkit CLI is already installed.');
      } else {
        buntstift.error('Failed to update the wolkenkit CLI.');
      }

      buntstift.warn('The command update is deprecated and will be removed in a future version, use npm instead.');

      throw ex;
    }

    stopWaiting();
    buntstift.success('Updated the wolkenkit CLI.');
    buntstift.warn('The command update is deprecated and will be removed in a future version, use npm instead.');
  }
};

module.exports = update;
