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

const restart = {
  description: 'Restart an application.',

  async getOptionDefinitions () {
    return [
      {
        name: 'env',
        alias: 'e',
        type: String,
        defaultValue: processenv('WOLKENKIT_ENV') || defaults.env,
        description: 'select environment',
        typeLabel: '<env>'
      },
      {
        name: 'private-key',
        alias: 'k',
        type: String,
        description: 'select private key',
        typeLabel: '<file>'
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

    const privateKey = options['private-key'];

    if (help) {
      return buntstift.info(getUsage([
        { header: 'wolkenkit restart', content: this.description },
        { header: 'Synopsis', content: stripIndent`
          wolkenkit restart [--env <env>]
          wolkenkit restart [--env <env>] [--private-key <file>]` },
        { header: 'Options', optionList: [ ...await this.getOptionDefinitions(), ...globalOptionDefinitions ]}
      ]));
    }

    buntstift.info('Restarting the application...');

    const stopWaiting = buntstift.wait();

    try {
      await wolkenkit.commands.restart({
        directory,
        env,
        privateKey
      }, showProgress(verbose, stopWaiting));
    } catch (ex) {
      stopWaiting();

      switch (ex.code) {
        case 'ECONFIGURATIONMALFORMED':
          if (ex.message === 'Missing required property: certificate (at wolkenkit.environments.default.api.certificate).') {
            buntstift.error('Certificate is missing.');
            buntstift.warn('Due to a security issue in wolkenkit, the built-in certificate for local.wolkenkit.ui is no longer supported. Please provide a custom certificate.');
            buntstift.warn('For details see https://docs.wolkenkit.io/3.1.0/reference/configuring-an-application/using-custom-certificates/');
          }

          throw ex;
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
        default:
          break;
      }

      buntstift.error('Failed to restart the application.');

      throw ex;
    }

    stopWaiting();
    buntstift.success('Restarted the application.');
  }
};

module.exports = restart;
