"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startProcess = void 0;
const axios_1 = __importDefault(require("axios"));
const getApplicationRoot_1 = require("../../common/application/getApplicationRoot");
const path_1 = __importDefault(require("path"));
const retry_ignore_abort_1 = require("retry-ignore-abort");
const runfork_1 = require("runfork");
const startProcess = async function ({ runtime, name, enableDebugMode, portOrSocket, env = {}, onExit }) {
    const applicationRoot = await getApplicationRoot_1.getApplicationRoot({ directory: __dirname });
    const stopProcess = runfork_1.runfork({
        nodeArgs: enableDebugMode ? ['--inspect'] : [],
        path: path_1.default.join(applicationRoot, 'build', 'lib', 'runtimes', runtime, 'processes', name, 'app.js'),
        env,
        silent: false,
        onExit
    });
    await retry_ignore_abort_1.retry(async () => {
        // eslint-disable-next-line unicorn/prefer-ternary
        if (typeof portOrSocket === 'number') {
            await axios_1.default({
                method: 'get',
                url: `http://localhost:${portOrSocket}/health/v2`
            });
        }
        else {
            await axios_1.default({
                method: 'get',
                url: `http://localhost/health/v2`,
                socketPath: portOrSocket
            });
        }
    });
    return stopProcess;
};
exports.startProcess = startProcess;
//# sourceMappingURL=startProcess.js.map