"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rootCommand = void 0;
const documentationCommand_1 = require("./documentation/documentationCommand");
const versionsCommand_1 = require("./versions/versionsCommand");
const rootCommand = function () {
    return {
        name: 'concierge',
        description: 'Manages wolkenkit development.',
        optionDefinitions: [
            {
                name: 'verbose',
                alias: 'v',
                description: 'enable verbose mode',
                type: 'boolean',
                isRequired: false,
                defaultValue: false
            }
        ],
        handle({ getUsage }) {
            /* eslint-disable no-console */
            console.log(getUsage({ commandPath: ['concierge'] }));
            /* eslint-enable no-console */
        },
        subcommands: {
            documentation: documentationCommand_1.documentationCommand(),
            versions: versionsCommand_1.versionsCommand()
        }
    };
};
exports.rootCommand = rootCommand;
//# sourceMappingURL=rootCommand.js.map