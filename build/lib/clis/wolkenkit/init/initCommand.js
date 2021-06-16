"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCommand = void 0;
const adjustPackageJson_1 = require("./adjustPackageJson");
const adjustTsConfig_1 = require("./adjustTsConfig");
const arrayToSentence_1 = require("../../../common/utils/arrayToSentence");
const buntstift_1 = require("buntstift");
const createDockerConfiguration_1 = require("./createDockerConfiguration");
const ejs_1 = __importDefault(require("ejs"));
const exists_1 = require("../../../common/utils/fs/exists");
const fs_1 = __importDefault(require("fs"));
const getAbsolutePath_1 = require("../../../common/utils/path/getAbsolutePath");
const getApplicationRoot_1 = require("../../../common/application/getApplicationRoot");
const getTemplateData_1 = require("./getTemplateData");
const languages_1 = require("./languages");
const lodash_1 = require("lodash");
const nameRegularExpression_1 = require("./nameRegularExpression");
const path_1 = __importDefault(require("path"));
const printFooter_1 = require("../printFooter");
const readdirRecursive_1 = require("../../../common/utils/fs/readdirRecursive");
const templates_1 = require("./templates");
const validateLanguage_1 = require("./validateLanguage");
const validateName_1 = require("./validateName");
const validateTemplate_1 = require("./validateTemplate");
const shelljs_1 = require("shelljs");
const errors = __importStar(require("../../../common/errors"));
const initCommand = function () {
    return {
        name: 'init',
        description: 'Initialize a new application.',
        optionDefinitions: [
            {
                name: 'template',
                alias: 't',
                description: `select a template, must be ${arrayToSentence_1.arrayToSentence({
                    data: templates_1.templates.map((template) => template.id),
                    conjunction: 'or',
                    itemPrefix: `'`,
                    itemSuffix: `'`
                })}`,
                parameterName: 'name',
                type: 'string',
                isRequired: false,
                validate: validateTemplate_1.validateTemplate
            }, {
                name: 'language',
                alias: 'l',
                description: `select a programming language, must be ${arrayToSentence_1.arrayToSentence({
                    data: languages_1.languages.map((language) => language.id),
                    conjunction: 'or',
                    itemPrefix: `'`,
                    itemSuffix: `'`
                })}`,
                parameterName: 'name',
                type: 'string',
                isRequired: false,
                validate: validateLanguage_1.validateLanguage
            },
            {
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
                validate: validateName_1.validateName
            }
        ],
        async handle({ options: { verbose, template, language, directory, name } }) {
            buntstift_1.buntstift.configure(buntstift_1.buntstift.getConfiguration().
                withVerboseMode(verbose));
            const stopWaiting = buntstift_1.buntstift.wait();
            try {
                let selectedName = name;
                if (!selectedName) {
                    selectedName = await buntstift_1.buntstift.ask('Enter the application name:', nameRegularExpression_1.nameRegularExpression);
                }
                const targetDirectory = getAbsolutePath_1.getAbsolutePath({
                    path: directory !== null && directory !== void 0 ? directory : selectedName.replace(/\//gu, path_1.default.sep),
                    cwd: process.cwd()
                });
                if (await exists_1.exists({ path: targetDirectory })) {
                    buntstift_1.buntstift.info(`The directory '${targetDirectory}' already exists.`);
                    throw new errors.DirectoryAlreadyExists();
                }
                let selectedLanguage = language, selectedTemplate = template;
                if (!selectedTemplate) {
                    const selectedTemplateName = await buntstift_1.buntstift.select('Select a template:', lodash_1.map(templates_1.templates, 'name'));
                    selectedTemplate = templates_1.templates.find((temp) => temp.name === selectedTemplateName).id;
                }
                if (!selectedLanguage) {
                    const selectedLanguageName = await buntstift_1.buntstift.select('Select a language:', lodash_1.map(languages_1.languages, 'name'));
                    selectedLanguage = languages_1.languages.find((temp) => temp.name === selectedLanguageName).id;
                }
                const sourceDirectory = path_1.default.join(await getApplicationRoot_1.getApplicationRoot({ directory: __dirname }), 'templates', selectedTemplate, selectedLanguage);
                const packageJson = path_1.default.join(targetDirectory, 'package.json');
                buntstift_1.buntstift.info(`Initializing the '${selectedName}' application...`);
                buntstift_1.buntstift.verbose(`Copying and rendering files from ${sourceDirectory} to ${targetDirectory}...`);
                const { directories, files } = await readdirRecursive_1.readdirRecursive({ path: sourceDirectory });
                for (const relativeDirectoryPath of directories) {
                    shelljs_1.mkdir('-p', path_1.default.join(targetDirectory, relativeDirectoryPath));
                }
                for (const relativeFilePath of files) {
                    if (!relativeFilePath.endsWith('.ejs')) {
                        shelljs_1.cp(path_1.default.join(sourceDirectory, relativeFilePath), path_1.default.join(targetDirectory, relativeFilePath));
                        continue;
                    }
                    const renderedFile = await ejs_1.default.renderFile(path_1.default.join(sourceDirectory, relativeFilePath), getTemplateData_1.getTemplateData({ appName: selectedName }));
                    await fs_1.default.promises.writeFile(path_1.default.join(targetDirectory, relativeFilePath.replace('.ejs', '')), renderedFile, 'utf-8');
                }
                buntstift_1.buntstift.verbose('Copied and rendered files.');
                buntstift_1.buntstift.verbose(`Adjusting ${packageJson}...`);
                await adjustPackageJson_1.adjustPackageJson({
                    packageJson,
                    name: selectedName,
                    addTypeScript: selectedLanguage === 'typescript'
                });
                buntstift_1.buntstift.verbose('Adjusted package.json.');
                if (selectedLanguage === 'typescript') {
                    const tsconfig = path_1.default.join(targetDirectory, 'tsconfig.json');
                    buntstift_1.buntstift.verbose(`Adjusting ${tsconfig}...`);
                    await adjustTsConfig_1.adjustTsConfig({
                        tsconfig
                    });
                    buntstift_1.buntstift.verbose('Adjusted tsconfig.json.');
                }
                buntstift_1.buntstift.verbose('Creating Docker configuration...');
                await createDockerConfiguration_1.createDockerConfiguration({ directory: targetDirectory });
                buntstift_1.buntstift.verbose('Created Docker configuration.');
                buntstift_1.buntstift.success(`Initialized the '${selectedName}' application.`);
                buntstift_1.buntstift.newLine();
                buntstift_1.buntstift.info(`To run the '${selectedName}' application use the following commands:`);
                buntstift_1.buntstift.newLine();
                buntstift_1.buntstift.info(`  cd ${targetDirectory}`);
                buntstift_1.buntstift.info('  npm install');
                buntstift_1.buntstift.info('  npx wolkenkit dev');
                buntstift_1.buntstift.newLine();
                printFooter_1.printFooter();
            }
            catch (ex) {
                buntstift_1.buntstift.error('Failed to initialize the application.');
                throw ex;
            }
            finally {
                stopWaiting();
            }
        }
    };
};
exports.initCommand = initCommand;
//# sourceMappingURL=initCommand.js.map