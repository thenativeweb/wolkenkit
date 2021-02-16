import { adjustPackageJson } from './adjustPackageJson';
import { adjustTsConfig } from './adjustTsConfig';
import { arrayToSentence } from '../../../common/utils/arrayToSentence';
import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { createDockerConfiguration } from './createDockerConfiguration';
import ejs from 'ejs';
import { errors } from '../../../common/errors';
import { exists } from '../../../common/utils/fs/exists';
import fs from 'fs';
import { getAbsolutePath } from '../../../common/utils/path/getAbsolutePath';
import { getApplicationRoot } from '../../../common/application/getApplicationRoot';
import { getTemplateData } from './getTemplateData';
import { InitOptions } from './InitOptions';
import { languages } from './languages';
import { map } from 'lodash';
import { nameRegularExpression } from './nameRegularExpression';
import path from 'path';
import { printFooter } from '../printFooter';
import { readdirRecursive } from '../../../common/utils/fs/readdirRecursive';
import { templates } from './templates';
import { validateLanguage } from './validateLanguage';
import { validateName } from './validateName';
import { validateTemplate } from './validateTemplate';
import { cp, mkdir } from 'shelljs';

const initCommand = function (): Command<InitOptions> {
  return {
    name: 'init',
    description: 'Initialize a new application.',

    optionDefinitions: [
      {
        name: 'template',
        alias: 't',
        description: `select a template, must be ${arrayToSentence({
          data: templates.map((template): string => template.id),
          conjunction: 'or',
          itemPrefix: `'`,
          itemSuffix: `'`
        })}`,
        parameterName: 'name',
        type: 'string',
        isRequired: false,
        validate: validateTemplate
      }, {
        name: 'language',
        alias: 'l',
        description: `select a programming language, must be ${arrayToSentence({
          data: languages.map((language): string => language.id),
          conjunction: 'or',
          itemPrefix: `'`,
          itemSuffix: `'`
        })}`,
        parameterName: 'name',
        type: 'string',
        isRequired: false,
        validate: validateLanguage
      }, {
        name: 'directory',
        alias: 'd',
        description: 'set an output directory',
        parameterName: 'path',
        type: 'string',
        isRequired: false
      }, {
        name: 'name',
        alias: 'n',
        description: 'set an application name',
        type: 'string',
        isRequired: false,
        defaultOption: true,
        validate: validateName
      }
    ],

    async handle ({ options: {
      verbose,
      template,
      language,
      directory,
      name
    }}): Promise<void> {
      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );
      const stopWaiting = buntstift.wait();

      try {
        let selectedName = name;

        if (!selectedName) {
          selectedName = await buntstift.ask('Enter the application name:', nameRegularExpression);
        }

        const targetDirectory = getAbsolutePath({
          path: directory ?? selectedName.replace(/\//gu, path.sep),
          cwd: process.cwd()
        });

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
            map(languages, 'name'));

          selectedLanguage = languages.find(
            (temp): boolean => temp.name === selectedLanguageName
          )!.id;
        }

        const sourceDirectory = path.join(
          await getApplicationRoot({ directory: __dirname }),
          'templates',
          selectedTemplate,
          selectedLanguage
        );

        const packageJson = path.join(targetDirectory, 'package.json');

        buntstift.info(`Initializing the '${selectedName}' application...`);

        buntstift.verbose(`Copying and rendering files from ${sourceDirectory} to ${targetDirectory}...`);
        const { directories, files } = await readdirRecursive({ path: sourceDirectory });

        for (const relativeDirectoryPath of directories) {
          mkdir('-p', path.join(targetDirectory, relativeDirectoryPath));
        }
        for (const relativeFilePath of files) {
          if (!relativeFilePath.endsWith('.ejs')) {
            cp(path.join(sourceDirectory, relativeFilePath), path.join(targetDirectory, relativeFilePath));

            continue;
          }

          const renderedFile = await ejs.renderFile(
            path.join(sourceDirectory, relativeFilePath),
            getTemplateData({ appName: selectedName })
          );

          await fs.promises.writeFile(
            path.join(targetDirectory, relativeFilePath.replace('.ejs', '')),
            renderedFile,
            'utf-8'
          );
        }
        buntstift.verbose('Copied and rendered files.');

        buntstift.verbose(`Adjusting ${packageJson}...`);
        await adjustPackageJson({
          packageJson,
          name: selectedName,
          addTypeScript: selectedLanguage === 'typescript'
        });
        buntstift.verbose('Adjusted package.json.');

        if (selectedLanguage === 'typescript') {
          const tsconfig = path.join(targetDirectory, 'tsconfig.json');

          buntstift.verbose(`Adjusting ${tsconfig}...`);
          await adjustTsConfig({
            tsconfig
          });
          buntstift.verbose('Adjusted tsconfig.json.');
        }

        buntstift.verbose('Creating Docker configuration...');
        await createDockerConfiguration({ directory: targetDirectory });
        buntstift.verbose('Created Docker configuration.');

        buntstift.success(`Initialized the '${selectedName}' application.`);
        buntstift.newLine();
        buntstift.info(`To run the '${selectedName}' application use the following commands:`);
        buntstift.newLine();
        buntstift.info(`  cd ${targetDirectory}`);
        buntstift.info('  npm install');
        buntstift.info('  npx wolkenkit dev');

        buntstift.newLine();
        printFooter();
      } catch (ex: unknown) {
        buntstift.error('Failed to initialize the application.');

        throw ex;
      } finally {
        stopWaiting();
      }
    }
  };
};

export { initCommand };
