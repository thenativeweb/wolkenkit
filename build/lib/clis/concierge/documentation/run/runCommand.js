"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCommand = void 0;
const buntstift_1 = require("buntstift");
const shelljs_1 = require("shelljs");
const getApplicationRoot_1 = require("../../../../common/application/getApplicationRoot");
const path_1 = __importDefault(require("path"));
const runCommand = function () {
    return {
        name: 'run',
        description: 'Run the documentation.',
        optionDefinitions: [],
        async handle({ options: { verbose } }) {
            buntstift_1.buntstift.configure(buntstift_1.buntstift.getConfiguration().
                withVerboseMode(verbose));
            const stopWaiting = buntstift_1.buntstift.wait();
            try {
                const applicationRoot = await getApplicationRoot_1.getApplicationRoot({ directory: __dirname });
                const documentationDirectory = path_1.default.join(applicationRoot, 'websites', 'documentation');
                buntstift_1.buntstift.info('Running the documentation...');
                stopWaiting();
                shelljs_1.exec('npx next dev --port 4000', { cwd: documentationDirectory });
            }
            catch (ex) {
                buntstift_1.buntstift.error('Failed to run the documentation.');
                throw ex;
            }
            finally {
                stopWaiting();
            }
        }
    };
};
exports.runCommand = runCommand;
//# sourceMappingURL=runCommand.js.map