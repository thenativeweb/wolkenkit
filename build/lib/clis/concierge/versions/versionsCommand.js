"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.versionsCommand = void 0;
const verifyCommand_1 = require("./verify/verifyCommand");
const versionsCommand = function () {
    return {
        name: 'versions',
        description: 'Manage versions.',
        optionDefinitions: [],
        handle({ getUsage, ancestors }) {
            /* eslint-disable no-console */
            console.log(getUsage({ commandPath: [...ancestors, 'versions'] }));
            /* eslint-enable no-console */
        },
        subcommands: {
            verify: verifyCommand_1.verifyCommand()
        }
    };
};
exports.versionsCommand = versionsCommand;
//# sourceMappingURL=versionsCommand.js.map