"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileFileSystemCommand = void 0;
const buntstift_1 = require("buntstift");
const createFileStore_1 = require("../../../../../stores/fileStore/createFileStore");
const path_1 = __importDefault(require("path"));
const fileFileSystemCommand = function () {
    return {
        name: 'file-system',
        description: 'Set up a file-system file store.',
        optionDefinitions: [
            {
                name: 'directory',
                type: 'string',
                parameterName: 'path',
                isRequired: true
            }
        ],
        async handle({ options: { directory, verbose } }) {
            buntstift_1.buntstift.configure(buntstift_1.buntstift.getConfiguration().
                withVerboseMode(verbose));
            const stopWaiting = buntstift_1.buntstift.wait();
            const storeDirectory = path_1.default.resolve(process.cwd(), directory);
            const storeOptions = {
                type: 'FileSystem',
                directory: storeDirectory
            };
            try {
                buntstift_1.buntstift.info('Setting up the file-system file store...');
                const store = await createFileStore_1.createFileStore(storeOptions);
                await store.setup();
                await store.destroy();
                buntstift_1.buntstift.success('Successfully set up the file-system file store.');
            }
            catch (ex) {
                buntstift_1.buntstift.error('Failed to set up the file-system file store.');
                throw ex;
            }
            finally {
                stopWaiting();
            }
        }
    };
};
exports.fileFileSystemCommand = fileFileSystemCommand;
//# sourceMappingURL=fileFileSystemCommand.js.map