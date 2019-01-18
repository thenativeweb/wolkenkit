'use strict';

const buntstift = require('buntstift'),
      getUsage = require('command-line-usage'),
      processenv = require('processenv'),
      stripIndent = require('common-tags/lib/stripIndent');

const defaults = require('../defaults.json'),
      globalOptionDefinitions = require('../globalOptionDefinitions'),
      showProgress = require('../showProgress'),
      wolkenkit = require('../../wolkenkit');

const exportCommand = {
  description: 'Export application data.',

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
        name: 'to',
        alias: 't',
        type: String,
        description: 'set the directory to export to',
        typeLabel: '<directory>'
      },
      {
        name: 'from-event-store',
        type: Boolean,
        defaultValue: defaults.commands.export.fromEventStore,
        description: 'export the event store'
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
    if (options['from-event-store'] === undefined) {
      throw new Error('From event store is missing.');
    }

    const directory = process.cwd(),
          { env, to, help, verbose } = options;

    const fromEventStore = options['from-event-store'];

    if (help) {
      return buntstift.info(getUsage([
        { header: 'wolkenkit export', content: this.description },
        { header: 'Synopsis', content: stripIndent`
          wolkenkit export [--env <env>] --to=<directory> [--from-event-store]` },
        { header: 'Options', optionList: [ ...await this.getOptionDefinitions(), ...globalOptionDefinitions ]}
      ]));
    }

    if (!to) {
      buntstift.error('The --to option is missing.');

      throw new Error('To is missing.');
    }

    buntstift.info('Exporting application data...');

    const stopWaiting = buntstift.wait();

    try {
      await wolkenkit.commands.export({
        directory,
        env,
        fromEventStore,
        to
      }, showProgress(verbose, stopWaiting));
    } catch (ex) {
      stopWaiting();

      switch (ex.code) {
        case 'EAPPLICATIONNOTRUNNING':
          buntstift.error('The application is not running.');
          break;
        case 'EAPPLICATIONPARTIALLYRUNNING':
          buntstift.error('The application is partially running.');
          break;
        default:
          buntstift.error('Failed to export application data.');
          break;
      }

      throw ex;
    }

    stopWaiting();
    buntstift.success('Exported application data.');
  }
};

module.exports = exportCommand;
