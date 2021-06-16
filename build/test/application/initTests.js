"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const isolated_1 = require("isolated");
const path_1 = __importDefault(require("path"));
const shelljs_1 = __importDefault(require("shelljs"));
const rootPath = path_1.default.join(__dirname, '..', '..');
const cliPath = path_1.default.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');
const initializeApplicationAndRunTests = async function ({ template, language }) {
    const appName = 'test-app';
    const appDirectory = path_1.default.join(await isolated_1.isolated(), appName);
    const initCommand = `node ${cliPath} --verbose init --directory ${appDirectory} --template ${template} --language ${language} ${appName}`;
    let { code } = shelljs_1.default.exec(initCommand);
    assertthat_1.assert.that(code).is.equalTo(0);
    ({ code } = shelljs_1.default.exec('npm install', { cwd: appDirectory }));
    assertthat_1.assert.that(code).is.equalTo(0);
    ({ code } = shelljs_1.default.exec('npm run test', { cwd: appDirectory }));
    assertthat_1.assert.that(code).is.equalTo(0);
};
suite('init', function () {
    this.timeout(300000);
    const templates = ['blank', 'chat', 'chat-simplified'];
    const languages = ['javascript', 'typescript'];
    templates.forEach((template) => {
        languages.forEach((language) => {
            suite(template, () => {
                suite(language, () => {
                    test('has successfully running tests.', async () => {
                        await initializeApplicationAndRunTests({ template, language });
                    });
                });
            });
        });
    });
});
//# sourceMappingURL=initTests.js.map