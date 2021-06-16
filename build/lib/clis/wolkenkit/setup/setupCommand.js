"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCommand = void 0;
const infrastructureCommand_1 = require("./infrastructure/infrastructureCommand");
const storeCommand_1 = require("./store/storeCommand");
const setupCommand = function () {
    return {
        name: 'setup',
        description: 'Set up the environment.',
        optionDefinitions: [],
        handle({ getUsage, ancestors }) {
            // eslint-disable-next-line no-console
            console.log(getUsage({ commandPath: [...ancestors, 'setup'] }));
        },
        subcommands: {
            infrastructure: infrastructureCommand_1.infrastructureCommand(),
            store: storeCommand_1.storeCommand()
        }
    };
};
exports.setupCommand = setupCommand;
//# sourceMappingURL=setupCommand.js.map