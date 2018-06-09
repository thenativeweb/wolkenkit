'use strict';

const buntstift = require('buntstift'),
      getUsage = require('command-line-usage'),
      stripIndent = require('common-tags/lib/stripIndent');

const globalOptionDefinitions = require('../globalOptionDefinitions'),
      telemetry = require('../../telemetry');

const command = {
  description: 'Enable or disable collecting telemetry data.',

  async getOptionDefinitions () {
    return [
      {
        name: 'enable',
        type: Boolean,
        description: 'enable collecting telemetry data'
      },
      {
        name: 'disable',
        type: Boolean,
        description: 'disable collecting telemetry data'
      }
    ];
  },

  async run (options) {
    if (!options) {
      throw new Error('Options are missing.');
    }

    const { help, enable, disable } = options;

    if (help) {
      return buntstift.info(getUsage([
        { header: 'wolkenkit telemetry', content: this.description },
        { header: 'Synopsis', content: stripIndent`
          wolkenkit telemetry --enable
          wolkenkit telemetry --disable` },
        { header: 'Options', optionList: [ ...await this.getOptionDefinitions(), ...globalOptionDefinitions ]}
      ]));
    }

    const optionList = { enable, disable };
    const count = Object.keys(optionList).filter(key => optionList[key] !== undefined).length;

    if (count === 0) {
      const isEnabled = await telemetry.isEnabled();

      if (isEnabled) {
        return buntstift.success('Collecting telemetry data is enabled.');
      }

      return buntstift.error('Collecting telemetry data is disabled.');
    }

    if (count > 1) {
      buntstift.error('Either provide --enable or --disable.');

      throw new Error('Mutually exclusive parameters given');
    }

    if (enable) {
      await telemetry.enable();

      return buntstift.success('Enabled collecting telemetry data.');
    }

    if (disable) {
      await telemetry.disable();

      return buntstift.success('Disabled collecting telemetry data.');
    }
  }
};

module.exports = command;
