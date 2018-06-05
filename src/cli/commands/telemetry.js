'use strict';

const buntstift = require('buntstift'),
      getUsage = require('command-line-usage'),
      stripIndent = require('common-tags/lib/stripIndent');

const globalOptionDefinitions = require('../globalOptionDefinitions'),
      telemetry = require('../../telemetry');

const command = {
  description: 'Enable and disable telemetry data collecting.',

  async getOptionDefinitions () {
    return [
      {
        name: 'enable',
        type: Boolean,
        description: 'enable collecting data'
      },
      {
        name: 'disable',
        type: Boolean,
        description: 'disable collecting data'
      },
      {
        name: 'enabled',
        type: Boolean,
        description: 'show if collecting data is enabled'
      },
      {
        name: 'disabled',
        type: Boolean,
        description: 'show if collecting data is disabled'
      }
    ];
  },

  async run (options) {
    if (!options) {
      throw new Error('Options are missing.');
    }

    const { help, enable, disable, enabled, disabled } = options;
    const optionList = { enable, disable, enabled, disabled };

    let count = 0;

    Object.keys(options).forEach(key => {
      const option = optionList[key];

      if (option !== undefined) {
        count += 1;
      }
    });

    if (help || count === 0) {
      return buntstift.info(getUsage([
        { header: 'wolkenkit telemetry', content: this.description },
        { header: 'Synopsis', content: stripIndent`
          wolkenkit telemetry --enable
          wolkenkit telemetry --disable
          wolkenkit telemetry --enabled
          wolkenkit telemetry --disabled` },
        { header: 'Options', optionList: [ ...await this.getOptionDefinitions(), ...globalOptionDefinitions ]}
      ]));
    }

    if (count > 1) {
      buntstift.error('Please enter only one option at a time.');

      throw new Error('Multiple options given.');
    }

    if (enable) {
      await telemetry.enable();

      return buntstift.success('Enabled telemetry data collecting.');
    }

    if (disable) {
      await telemetry.disable();

      return buntstift.success('Disabled telemetry data collecting.');
    }

    if (enabled) {
      const isEnabled = await telemetry.isEnabled();

      if (isEnabled) {
        return buntstift.success('Telemetry data collecting is enabled.');
      }

      return buntstift.error('Telemetry data collecting is disabled.');
    }

    if (disabled) {
      const isEnabled = await telemetry.isEnabled();

      if (!isEnabled) {
        return buntstift.success('Telemetry data collecting is disabled.');
      }

      return buntstift.error('Telemetry data collecting is enabled.');
    }
  }
};

module.exports = command;
