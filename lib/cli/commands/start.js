'use strict';

const buntstift = require('buntstift'),
      eslint = require('eslint'),
      getUsage = require('command-line-usage'),
      processenv = require('processenv'),
      stripIndent = require('common-tags/lib/stripIndent');

const defaults = require('../defaults.json'),
      globalOptionDefinitions = require('../globalOptionDefinitions'),
      showProgress = require('../showProgress'),
      wolkenkit = require('../../wolkenkit');

const init = {
  description: 'Start an application.',

  async getOptionDefinitions () {
    return [
      {
        name: 'dangerously-destroy-data',
        type: Boolean,
        defaultValue: defaults.commands.start.dangerouslyDestroyData,
        description: 'destroy persistent data'
      },
      {
        name: 'dangerously-expose-http-ports',
        type: Boolean,
        defaultValue: defaults.commands.start.dangerouslyExposeHttpPorts,
        description: 'expose http ports'
      },
      {
        name: 'debug',
        alias: 'd',
        type: Boolean,
        defaultValue: defaults.commands.start.debug,
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
        name: 'persist',
        type: Boolean,
        defaultValue: defaults.commands.start.persist,
        description: 'enable persistence'
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
        name: 'private-key',
        alias: 'k',
        type: String,
        description: 'select private key',
        typeLabel: '<file>'
      },
      {
        // The shared key has no default value set, as this varies from call to
        // call, and it makes a difference whether it has been set or not.
        name: 'shared-key',
        alias: 's',
        type: String,
        description: 'set shared key',
        typeLabel: '<key>'
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
    if (options['dangerously-expose-http-ports'] === undefined) {
      throw new Error('Dangerously expose http ports is missing.');
    }
    if (options.debug === undefined) {
      throw new Error('Debug is missing.');
    }
    if (!options.env) {
      throw new Error('Environment is missing.');
    }
    if (options.persist === undefined) {
      throw new Error('Persist is missing.');
    }

    const directory = process.cwd(),
          { debug, env, help, persist, port, verbose } = options;

    const dangerouslyDestroyData = options['dangerously-destroy-data'],
          dangerouslyExposeHttpPorts = options['dangerously-expose-http-ports'],
          privateKey = options['private-key'],
          sharedKey = options['shared-key'];

    if (help) {
      return buntstift.info(getUsage([
        { header: 'wolkenkit start', content: this.description },
        { header: 'Synopsis', content: stripIndent`
          wolkenkit start [--port <port>] [--env <env>] [--dangerously-expose-http-ports] [--dangerously-destroy-data] [--shared-key <key>] [--persist] [--debug]
          wolkenkit start [--env <env>] [--private-key <file>]` },
        { header: 'Options', optionList: [ ...await this.getOptionDefinitions(), ...globalOptionDefinitions ]}
      ]));
    }

    buntstift.info('Starting the application...');

    const stopWaiting = buntstift.wait();

    try {
      await wolkenkit.commands.start({
        directory,
        dangerouslyDestroyData,
        dangerouslyExposeHttpPorts,
        debug,
        env,
        persist,
        port,
        privateKey,
        sharedKey
      }, showProgress(verbose, stopWaiting));
    } catch (ex) {
      stopWaiting();

      switch (ex.code) {
        case 'ECODEMALFORMED': {
          const formatter = eslint.CLIEngine.getFormatter();

          const formattedResult = formatter(ex.cause.results);
          const output = formattedResult.
            split('\n').
            slice(0, -2).
            join('\n');

          buntstift.info(output);
          buntstift.info(ex.message);
          break;
        }
        case 'ERUNTIMEERROR': {
          if (ex.orginalError) {
            buntstift.newLine();
            buntstift.info(ex.orginalError.stack);
            buntstift.newLine();
          }

          buntstift.info('Application code caused runtime error.');
          break;
        }
        default:
          break;
      }

      buntstift.error('Failed to start the application.');

      throw ex;
    }

    stopWaiting();
    buntstift.success('Started the application.');
  }
};

module.exports = init;
