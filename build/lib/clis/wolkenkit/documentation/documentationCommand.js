"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentationCommand = void 0;
const buntstift_1 = require("buntstift");
const getApplicationRoot_1 = require("../../../common/application/getApplicationRoot");
const http_1 = require("../../../apis/getStatic/http");
const http_2 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const validatePort_1 = require("./validatePort");
const documentationCommand = function () {
    return {
        name: 'documentation',
        description: 'Start the wolkenkit documentation.',
        optionDefinitions: [
            {
                name: 'port',
                alias: 'p',
                description: 'set a port',
                parameterName: 'port',
                type: 'number',
                isRequired: false,
                defaultValue: 4000,
                validate: validatePort_1.validatePort
            }
        ],
        async handle({ options: { verbose, port } }) {
            buntstift_1.buntstift.configure(buntstift_1.buntstift.getConfiguration().
                withVerboseMode(verbose));
            const stopWaiting = buntstift_1.buntstift.wait();
            try {
                buntstift_1.buntstift.info('Starting the documentation...');
                buntstift_1.buntstift.newLine();
                buntstift_1.buntstift.info(`  Port  ${port}`);
                const applicationRoot = await getApplicationRoot_1.getApplicationRoot({ directory: __dirname });
                const { api: staticApi } = await http_1.getApi({
                    corsOrigin: '*',
                    directory: path_1.default.join(applicationRoot, 'build', 'websites', 'documentation')
                });
                http_2.default.createServer(staticApi).listen(port, () => {
                    buntstift_1.buntstift.newLine();
                    buntstift_1.buntstift.info('To stop the documentation, press <Ctrl>+<C>.');
                    buntstift_1.buntstift.line();
                });
            }
            catch (ex) {
                buntstift_1.buntstift.error('Failed to start the documentation.');
                throw ex;
            }
            finally {
                stopWaiting();
            }
        }
    };
};
exports.documentationCommand = documentationCommand;
//# sourceMappingURL=documentationCommand.js.map