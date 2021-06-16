"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const fs_1 = __importDefault(require("fs"));
const isolated_1 = require("isolated");
const path_1 = __importDefault(require("path"));
const shelljs_1 = __importDefault(require("shelljs"));
const common_tags_1 = require("common-tags");
const uuid_1 = require("uuid");
const appName = 'test-app';
const rootPath = path_1.default.join(__dirname, '..', '..', '..');
const cliPath = path_1.default.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');
suite('setup infrastructure', function () {
    this.timeout(300000);
    test(`sets up an application's infrastructure.`, async () => {
        const appDirectory = path_1.default.join(await isolated_1.isolated(), appName);
        const initCommand = `node ${cliPath} --verbose init --directory ${appDirectory} --template chat --language javascript ${appName}`;
        shelljs_1.default.exec(initCommand);
        shelljs_1.default.exec(`npm install --production`, {
            cwd: appDirectory
        });
        shelljs_1.default.exec(`node ${cliPath} build`, {
            cwd: appDirectory
        });
        const randomString = uuid_1.v4();
        await fs_1.default.promises.writeFile(path_1.default.join(appDirectory, 'build', 'server', 'infrastructure', 'setupInfrastructure.js'), common_tags_1.stripIndents `
        'use strict';
        const setupInfrastructure = async function () {
          console.log('${randomString}');
        };
        module.exports = { setupInfrastructure };
      `);
        const setupInfrastructureCommand = `node ${cliPath} --verbose setup infrastructure`;
        const { stdout } = shelljs_1.default.exec(setupInfrastructureCommand, {
            cwd: appDirectory
        });
        assertthat_1.assert.that(stdout).is.containing(`Setting up the infrastructure for the '${appName}' application...`);
        assertthat_1.assert.that(stdout).is.containing(randomString);
        assertthat_1.assert.that(stdout).is.containing(`Successfully set up the infrastructure for the '${appName}' application...`);
    });
});
//# sourceMappingURL=infrastructureTests.js.map