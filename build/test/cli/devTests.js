"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const axios_1 = __importDefault(require("axios"));
const getSocketPaths_1 = require("../shared/getSocketPaths");
const isolated_1 = require("isolated");
const path_1 = __importDefault(require("path"));
const retry_ignore_abort_1 = require("retry-ignore-abort");
const shelljs_1 = __importDefault(require("shelljs"));
const appName = 'test-app';
const rootPath = path_1.default.join(__dirname, '..', '..');
const cliPath = path_1.default.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');
suite('dev', function () {
    this.timeout(300000);
    test('starts the application.', async () => {
        const appDirectory = path_1.default.join(await isolated_1.isolated(), appName);
        const initCommand = `node ${cliPath} --verbose init --directory ${appDirectory} --template chat --language javascript ${appName}`;
        shelljs_1.default.exec(initCommand);
        shelljs_1.default.exec(`npm install --production`, {
            cwd: appDirectory
        });
        const [socket, healthSocket] = await getSocketPaths_1.getSocketPaths({ count: 2 });
        const devCommand = `node ${cliPath} --verbose dev --socket ${socket} --health-socket ${healthSocket}`;
        const childProcess = shelljs_1.default.exec(devCommand, {
            cwd: appDirectory,
            async: true
        });
        await assertthat_1.assert.that(async () => {
            await retry_ignore_abort_1.retry(async () => {
                await axios_1.default({
                    method: 'get',
                    url: `http://localhost/health/v2`,
                    socketPath: healthSocket,
                    validateStatus: (status) => status === 200
                });
            }, { minTimeout: 500, maxTimeout: 500, retries: 20 });
        }).is.not.throwingAsync();
        childProcess.kill();
    });
});
//# sourceMappingURL=devTests.js.map