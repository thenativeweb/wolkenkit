'use strict';

const buntstift = require('buntstift'),
      getUsage = require('command-line-usage'),
      processenv = require('processenv'),
      stripIndent = require('common-tags/lib/stripIndent');

const defaults = require('../../defaults.json'),
      globalOptionDefinitions = require('../../globalOptionDefinitions'),
      showProgress = require('../../showProgress'),
      wolkenkit = require('../../../wolkenkit');

const start = {
  description: 'Start an infrastructure.',

  async getOptionDefinitions () {
    return [
      {
        name: 'dangerously-destroy-data',
        type: Boolean,
        defaultValue: defaults.commands.infrastructure.start.dangerouslyDestroyData,
        description: 'destroy persistent data'
      },
      {
        name: 'debug',
        alias: 'd',
        type: Boolean,
        defaultValue: defaults.commands.infrastructure.start.debug,
        description: 'enable debug mode'
      },
      {
        name: 'env',
        alias: 'e',
        type: String,
        defaultValue: processenv('WOLKENKIT_ENV') || defaults.env,
        description: 'select environment',
        typeLabel: '<env>'
      },
      {
        // The port has no default value set, as this depends on the
        // application's package.json file, which is not available here.
        name: 'port',
        alias: 'p',
        type: Number,
        description: 'set port',
        typeLabel: '<port>'
      },
      {
        // The secret has no default value set, as this varies from call to
        // call, and it makes a difference whether it has been set or not.
        name: 'secret',
        alias: 's',
        type: String,
        description: 'set secret',
        typeLabel: '<secret>'
      }
    ];
  },

  async run (options) {
    if (!options) {
      throw new Error('Options are missing.');
    }
    if (options['dangerously-destroy-data'] === undefined) {
      throw new Error('Dangerously destroy data is missing.');
    }
    if (options.debug === undefined) {
      throw new Error('Debug is missing.');
    }
    if (!options.env) {
      throw new Error('Environment is missing.');
    }

    const directory = process.cwd(),
          { debug, env, help, port, secret, verbose } = options;

    const dangerouslyDestroyData = options['dangerously-destroy-data'];

    if (help) {
      return buntstift.info(getUsage([
        { header: 'wolkenkit infrastructure start', content: this.description },
        { header: 'Synopsis', content: stripIndent`
          wolkenkit infrastructure start [--port <port>] [--env <env>] [--dangerously-destroy-data] [--secret <secret>] [--debug]` },
        { header: 'Options', optionList: [ ...await this.getOptionDefinitions(), ...globalOptionDefinitions ]}
      ]));
    }

    buntstift.info('Starting the infrastructure...');

    const stopWaiting = buntstift.wait();

    try {
      await wolkenkit.commands.infrastructure.start({
        directory,
        dangerouslyDestroyData,
        debug,
        env,
        port,
        secret
      }, showProgress(verbose, stopWaiting));
    } catch (ex) {
      stopWaiting();

      buntstift.error('Failed to start the infrastructure.');

      throw ex;
    }

    stopWaiting();
    buntstift.success('Started the infrastructure.');
  }
};

module.exports = start;
