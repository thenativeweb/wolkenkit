'use strict';

const buntstift = require('buntstift'),
      getUsage = require('command-line-usage'),
      open = require('open');

const globalOptionDefinitions = require('../globalOptionDefinitions');

const register = {
  async getOptionDefinitions () {
    return [];
  },

  async run (options) {
    if (!options) {
      throw new Error('Options are missing.');
    }

    const { help } = options;

    if (help) {
      return buntstift.info(getUsage([
        { header: 'wolkenkit register', content: this.description },
        { header: 'Synopsis', content: 'wolkenkit register' },
        { header: 'Options', optionList: [ ...await this.getOptionDefinitions(), ...globalOptionDefinitions ]}
      ]));
    }

    const url = 'https://profile.thenativeweb.io';

    buntstift.info(`Pointing web browser to ${url}...`);

    await open(url);
  }
};

module.exports = register;
