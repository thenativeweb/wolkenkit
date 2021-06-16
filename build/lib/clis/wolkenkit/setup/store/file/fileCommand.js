"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileCommand = void 0;
const fileFileSystemCommand_1 = require("./fileFileSystemCommand");
const fileS3Command_1 = require("./fileS3Command");
const fileCommand = function () {
    return {
        name: 'file',
        description: 'Set up a file store.',
        optionDefinitions: [],
        handle({ getUsage, ancestors }) {
            /* eslint-disable no-console */
            console.log(getUsage({ commandPath: [...ancestors, 'file'] }));
            /* eslint-enable no-console */
        },
        subcommands: {
            'file-system': fileFileSystemCommand_1.fileFileSystemCommand(),
            s3: fileS3Command_1.fileS3Command()
        }
    };
};
exports.fileCommand = fileCommand;
//# sourceMappingURL=fileCommand.js.map