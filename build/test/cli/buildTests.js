"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const exists_1 = require("../../lib/common/utils/fs/exists");
const isolated_1 = require("isolated");
const path_1 = __importDefault(require("path"));
const shelljs_1 = __importDefault(require("shelljs"));
const rootPath = path_1.default.join(__dirname, '..', '..');
const cliPath = path_1.default.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');
suite('build', function () {
    this.timeout(300000);
    test('compiles a TypeScript application to JavaScript.', async () => {
        const appName = 'test-app';
        const appDirectory = path_1.default.join(await isolated_1.isolated(), appName);
        const initCommand = `node ${cliPath} --verbose init --directory ${appDirectory} --template blank --language typescript ${appName}`;
        const buildCommand = `node ${cliPath} --verbose build`;
        shelljs_1.default.exec(initCommand);
        shelljs_1.default.exec('npm install', { cwd: appDirectory });
        shelljs_1.default.exec(buildCommand, { cwd: appDirectory });
        assertthat_1.assert.that(await exists_1.exists({ path: path_1.default.join(appDirectory, 'build', 'server', 'domain', 'sampleContext', 'sampleAggregate', 'index.js') })).is.true();
        assertthat_1.assert.that(await exists_1.exists({ path: path_1.default.join(appDirectory, 'build', 'server', 'domain', 'sampleContext', 'sampleAggregate', 'SampleState.js') })).is.true();
        assertthat_1.assert.that(await exists_1.exists({ path: path_1.default.join(appDirectory, 'build', 'server', 'domain', 'sampleContext', 'sampleAggregate', 'domainEvents', 'sampleDomainEvent.js') })).is.true();
        assertthat_1.assert.that(await exists_1.exists({ path: path_1.default.join(appDirectory, 'build', 'server', 'domain', 'sampleContext', 'sampleAggregate', 'commands', 'sampleCommand.js') })).is.true();
        assertthat_1.assert.that(await exists_1.exists({ path: path_1.default.join(appDirectory, 'build', 'server', 'flows', 'sampleFlow', 'index.js') })).is.true();
        assertthat_1.assert.that(await exists_1.exists({ path: path_1.default.join(appDirectory, 'build', 'server', 'flows', 'sampleFlow', 'handlers', 'sampleHandler.js') })).is.true();
        assertthat_1.assert.that(await exists_1.exists({ path: path_1.default.join(appDirectory, 'build', 'server', 'infrastructure', 'getInfrastructure.js') })).is.true();
        assertthat_1.assert.that(await exists_1.exists({ path: path_1.default.join(appDirectory, 'build', 'server', 'infrastructure', 'index.js') })).is.true();
        assertthat_1.assert.that(await exists_1.exists({ path: path_1.default.join(appDirectory, 'build', 'server', 'infrastructure', 'setupInfrastructure.js') })).is.true();
        assertthat_1.assert.that(await exists_1.exists({ path: path_1.default.join(appDirectory, 'build', 'server', 'views', 'sampleView', 'index.js') })).is.true();
        assertthat_1.assert.that(await exists_1.exists({ path: path_1.default.join(appDirectory, 'build', 'server', 'views', 'sampleView', 'queries', 'all.js') })).is.true();
    });
    test('copies a JavaScript application to the build directory.', async () => {
        const appName = 'test-app';
        const appDirectory = path_1.default.join(await isolated_1.isolated(), appName);
        const initCommand = `node ${cliPath} --verbose init --directory ${appDirectory} --template blank --language javascript ${appName}`;
        const buildCommand = `node ${cliPath} --verbose build`;
        shelljs_1.default.exec(initCommand);
        shelljs_1.default.exec('npm install', { cwd: appDirectory });
        shelljs_1.default.exec(buildCommand, { cwd: appDirectory });
        assertthat_1.assert.that(await exists_1.exists({ path: path_1.default.join(appDirectory, 'build', 'server', 'domain', 'sampleContext', 'sampleAggregate', 'index.js') })).is.true();
        assertthat_1.assert.that(await exists_1.exists({ path: path_1.default.join(appDirectory, 'build', 'server', 'domain', 'sampleContext', 'sampleAggregate', 'SampleState.js') })).is.true();
        assertthat_1.assert.that(await exists_1.exists({ path: path_1.default.join(appDirectory, 'build', 'server', 'domain', 'sampleContext', 'sampleAggregate', 'domainEvents', 'sampleDomainEvent.js') })).is.true();
        assertthat_1.assert.that(await exists_1.exists({ path: path_1.default.join(appDirectory, 'build', 'server', 'domain', 'sampleContext', 'sampleAggregate', 'commands', 'sampleCommand.js') })).is.true();
        assertthat_1.assert.that(await exists_1.exists({ path: path_1.default.join(appDirectory, 'build', 'server', 'flows', 'sampleFlow', 'index.js') })).is.true();
        assertthat_1.assert.that(await exists_1.exists({ path: path_1.default.join(appDirectory, 'build', 'server', 'flows', 'sampleFlow', 'handlers', 'sampleHandler.js') })).is.true();
        assertthat_1.assert.that(await exists_1.exists({ path: path_1.default.join(appDirectory, 'build', 'server', 'infrastructure', 'getInfrastructure.js') })).is.true();
        assertthat_1.assert.that(await exists_1.exists({ path: path_1.default.join(appDirectory, 'build', 'server', 'infrastructure', 'index.js') })).is.true();
        assertthat_1.assert.that(await exists_1.exists({ path: path_1.default.join(appDirectory, 'build', 'server', 'infrastructure', 'setupInfrastructure.js') })).is.true();
        assertthat_1.assert.that(await exists_1.exists({ path: path_1.default.join(appDirectory, 'build', 'server', 'views', 'sampleView', 'index.js') })).is.true();
        assertthat_1.assert.that(await exists_1.exists({ path: path_1.default.join(appDirectory, 'build', 'server', 'views', 'sampleView', 'queries', 'all.js') })).is.true();
    });
});
//# sourceMappingURL=buildTests.js.map