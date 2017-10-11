'use strict';

const buntstift = require('buntstift'),
      getUsage = require('command-line-usage');

const globalOptionDefinitions = require('../globalOptionDefinitions'),
      showProgress = require('../showProgress'),
      wolkenkit = require('../../wolkenkit');

const lsRemote = {
  description: 'List available wolkenkit versions.',

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
        { header: 'wolkenkit ls-remote', content: this.description },
        { header: 'Synopsis', content: 'wolkenkit ls-remote' },
        { header: 'Options', optionList: [ ...await this.getOptionDefinitions(), ...globalOptionDefinitions ]}
      ]));
    }

    const stopWaiting = buntstift.wait();

    try {
      await wolkenkit.lsRemote(showProgress(verbose, stopWaiting));
    } catch (ex) {
      stopWaiting();
      buntstift.error('Failed to list available wolkenkit versions.');

      throw ex;
    }

    stopWaiting();
  }
};

module.exports = lsRemote;
