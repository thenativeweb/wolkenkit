"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentationCommand = void 0;
const buildCommand_1 = require("./build/buildCommand");
const runCommand_1 = require("./run/runCommand");
const documentationCommand = function () {
    return {
        name: 'documentation',
        description: 'Manage the documentation.',
        optionDefinitions: [],
        handle({ getUsage, ancestors }) {
            /* eslint-disable no-console */
            console.log(getUsage({ commandPath: [...ancestors, 'documentation'] }));
            /* eslint-enable no-console */
        },
        subcommands: {
            run: runCommand_1.runCommand(),
            build: buildCommand_1.buildCommand()
        }
    };
};
exports.documentationCommand = documentationCommand;
//# sourceMappingURL=documentationCommand.js.map