"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const axios_1 = __importDefault(require("axios"));
const getAvailablePort_1 = require("../shared/getAvailablePort");
const path_1 = __importDefault(require("path"));
const retry_ignore_abort_1 = require("retry-ignore-abort");
const shelljs_1 = __importDefault(require("shelljs"));
const rootPath = path_1.default.join(__dirname, '..', '..');
const cliPath = path_1.default.join(rootPath, 'build', 'lib', 'bin', 'wolkenkit.js');
suite('documentation', function () {
    this.timeout(30000);
    test('starts the documentation.', async () => {
        const port = await getAvailablePort_1.getAvailablePort();
        const documentationCommand = `node ${cliPath} --verbose documentation --port ${port}`;
        const childProcess = shelljs_1.default.exec(documentationCommand, { async: true });
        await assertthat_1.assert.that(async () => {
            await retry_ignore_abort_1.retry(async () => {
                await axios_1.default({
                    method: 'get',
                    url: `http://localhost:${port}/`,
                    validateStatus: (status) => status === 200
                });
            }, { minTimeout: 100, maxTimeout: 100, retries: 20 });
        }).is.not.throwingAsync();
        childProcess.kill();
    });
});
//# sourceMappingURL=documentationTests.js.map