'use strict';

const buntstift = require('buntstift'),
      getUsage = require('command-line-usage');

const checkDirectory = require('../../../commands/application/init/checkDirectory'),
      commands = require('../../../commands'),
      defaults = require('../../defaults.json'),
      globalOptionDefinitions = require('../../globalOptionDefinitions'),
      showProgress = require('../../showProgress');

const init = {
  description: 'Initialize a new application.',

  async getOptionDefinitions () {
    return [
      {
        name: 'template',
        alias: 't',
        type: String,
        description: 'template to clone',
        typeLabel: '<url>'
      },
      {
        name: 'force',
        alias: 'f',
        type: Boolean,
        defaultValue: defaults.commands.application.init.force,
        description: 'force overwriting files'
      }
    ];
  },

  async run (options) {
    if (!options) {
      throw new Error('Options are missing.');
    }
    if (options.force === undefined) {
      throw new Error('Force is missing.');
    }

    const directory = process.cwd(),
          { help, verbose, template, force } = options;

    if (help) {
      return buntstift.info(getUsage([
        { header: 'wolkenkit application init', content: this.description },
        { header: 'Synopsis', content: 'wolkenkit application init [--template <url>] [--force]' },
        { header: 'Options', optionList: [ ...await this.getOptionDefinitions(), ...globalOptionDefinitions ]},
        { header: 'Remarks', content: `If you don't specify a template, you will be asked to select one.` }
      ]));
    }

    buntstift.info('Initializing a new application...');

    const stopWaiting = buntstift.wait();

    let selectedTemplate = template;

    try {
      await checkDirectory({ directory, force }, showProgress(verbose, stopWaiting));

      if (!selectedTemplate) {
        const availableTemplates = [
          {
            description: 'Empty (directories without files)',
            url: 'https://github.com/thenativeweb/wolkenkit-template-empty.git#master'
          },
          {
            description: 'Minimal (directories and files)',
            url: 'https://github.com/thenativeweb/wolkenkit-template-minimal.git#master'
          },
          {
            description: 'Chat (sample application)',
            url: 'https://github.com/thenativeweb/wolkenkit-template-chat.git#master'
          }
        ];

        const selectedDescription = await buntstift.select(
          'Select a template to initialize your application with:',
          availableTemplates.map(availableTemplate => availableTemplate.description)
        );

        selectedTemplate = availableTemplates.find(
          availableTemplate => availableTemplate.description === selectedDescription
        ).url;
      }

      await commands.application.init({
        directory,
        template: selectedTemplate,
        force
      }, showProgress(verbose, stopWaiting));
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
