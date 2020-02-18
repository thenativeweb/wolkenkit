import { adjustPackageJson } from './adjustPackageJson';
import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { cp } from 'shelljs';
import { errors } from '../../common/errors';
import { exists } from '../../common/utils/fs/exists';
import { getAbsolutePath } from '../../common/utils/path/getAbsolutePath';
import { InitOptions } from './InitOptions';
import path from 'path';
import { templates } from './templates';
import { validateLanguage } from './validateLanguage';
import { validateName } from './validateName';
import { validateTemplate } from './validateTemplate';
import { validLanguages } from './validLanguages';
import { map, sample } from 'lodash';

const initCommand = function (): Command<InitOptions> {
  return {
    name: 'init',
    description: 'Initialize a new application.',

    optionDefinitions: [
      {
        name: 'template',
        alias: 't',
        description: 'specify the name of a template',
        parameterName: 'name',
        type: 'string',
        isRequired: false,
        validate: validateTemplate
      }, {
        name: 'language',
        alias: 'l',
        description: 'select a programming language',
        parameterName: 'name',
        type: 'string',
        isRequired: false,
        validate: validateLanguage
      }, {
        name: 'out-dir',
        alias: 'o',
        description: 'set the output directory',
        parameterName: 'path',
        type: 'string',
        isRequired: false
      }, {
        name: 'name',
        alias: 'n',
        description: 'set the application name',
        type: 'string',
        isRequired: true,
        defaultOption: true,
        validate: validateName
      }
    ],

    async handle ({ options: { verbose, template, language, 'out-dir': outDir, name }}): Promise<void> {
      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );
      const stopWaiting = buntstift.wait();

      try {
        const targetDirectory = getAbsolutePath({ path: outDir ?? name, cwd: process.cwd() });

        if (await exists({ path: targetDirectory })) {
          buntstift.info(`The directory '${targetDirectory}' already exists.`);
          throw new errors.DirectoryAlreadyExists();
        }

        let selectedLanguage = language,
            selectedTemplate = template;

        if (!selectedTemplate) {
          const selectedTemplateName = await buntstift.select('Select a template:',
            map(templates, 'name'));

          selectedTemplate = templates.find(
            (temp): boolean => temp.name === selectedTemplateName
          )!.id;
        }

        if (!selectedLanguage) {
          const selectedLanguageName = await buntstift.select('Select a language:',
            map(validLanguages, 'name'));

          selectedLanguage = validLanguages.find(
            (validLanguage): boolean => validLanguage.name === selectedLanguageName
          )!.id;
        }

        const sourceDirectory = path.join(
          __dirname, '..', '..', '..', 'templates', selectedTemplate, selectedLanguage
        );

        const packageJson = path.join(targetDirectory, 'package.json');

        const emojis = [ '🦄', '🎉', '🌟', '🌈', '😊', '❤️', '💝' ];

        buntstift.info(`Initializing the '${name}' application...`);

        buntstift.verbose(`Copying files from ${sourceDirectory} to ${targetDirectory}...`);
        cp('-R', sourceDirectory, targetDirectory);
        buntstift.verbose('Copied files.');

        buntstift.verbose(`Adjusting ${packageJson}...`);
        await adjustPackageJson({ packageJson, name });
        buntstift.verbose('Adjusted package.json.');

        buntstift.success(`Initialized the '${name}' application.`);
        buntstift.newLine();
        buntstift.info(`To run the '${name}' application use the following commands:`);
        buntstift.newLine();
        buntstift.info(`  cd ${targetDirectory}`);
        buntstift.info('  npm install');
        buntstift.info('  npx wolkenkit dev');
        buntstift.newLine();
        buntstift.info('If you experience any difficulties, please go to:');
        buntstift.newLine();
        buntstift.info('  https://docs.wolkenkit.io/latest/getting-started/understanding-wolkenkit/getting-help/');
        buntstift.newLine();
        buntstift.info(`Thank you for using wolkenkit ${sample(emojis)}`);
      } catch (ex) {
        buntstift.error(`Failed to initialize the '${name}' application.`);

        throw ex;
      } finally {
        stopWaiting();
      }
    }
  };
};

export { initCommand };
