"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCommand = void 0;
const buntstift_1 = require("buntstift");
const getApplicationRoot_1 = require("../../../../common/application/getApplicationRoot");
const path_1 = __importDefault(require("path"));
const shelljs_1 = require("shelljs");
const buildCommand = function () {
    return {
        name: 'build',
        description: 'Build the documentation.',
        optionDefinitions: [],
        async handle({ options: { verbose } }) {
            buntstift_1.buntstift.configure(buntstift_1.buntstift.getConfiguration().
                withVerboseMode(verbose));
            const stopWaiting = buntstift_1.buntstift.wait();
            try {
                const applicationRoot = await getApplicationRoot_1.getApplicationRoot({ directory: __dirname });
                const documentationDirectory = path_1.default.join(applicationRoot, 'websites', 'documentation');
                const outputDirectory = path_1.default.join(applicationRoot, 'build', 'websites', 'documentation');
                buntstift_1.buntstift.info('Building the documentation...');
                shelljs_1.rm('-rf', path_1.default.join(documentationDirectory, '.next'));
                shelljs_1.exec('npx next build', { cwd: documentationDirectory });
                shelljs_1.exec(`npx next export -o '${outputDirectory}'`, { cwd: documentationDirectory });
                buntstift_1.buntstift.success('Built documentation.');
            }
            catch (ex) {
                buntstift_1.buntstift.error('Failed to build documentation.');
                throw ex;
            }
            finally {
                stopWaiting();
            }
        }
    };
};
exports.buildCommand = buildCommand;
//# sourceMappingURL=buildCommand.js.map