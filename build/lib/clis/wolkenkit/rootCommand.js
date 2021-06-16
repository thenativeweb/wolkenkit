"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rootCommand = void 0;
const buildCommand_1 = require("./build/buildCommand");
const devCommand_1 = require("./dev/devCommand");
const documentationCommand_1 = require("./documentation/documentationCommand");
const healthCommand_1 = require("./health/healthCommand");
const initCommand_1 = require("./init/initCommand");
const replayCommand_1 = require("./replay/replayCommand");
const setupCommand_1 = require("./setup/setupCommand");
const tokenCommand_1 = require("./token/tokenCommand");
const rootCommand = function () {
    return {
        name: 'wolkenkit',
        description: 'Manages wolkenkit.',
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
            console.log(getUsage({ commandPath: ['wolkenkit'] }));
            /* eslint-enable no-console */
        },
        subcommands: {
            init: initCommand_1.initCommand(),
            dev: devCommand_1.devCommand(),
            build: buildCommand_1.buildCommand(),
            documentation: documentationCommand_1.documentationCommand(),
            health: healthCommand_1.healthCommand(),
            setup: setupCommand_1.setupCommand(),
            replay: replayCommand_1.replayCommand(),
            token: tokenCommand_1.tokenCommand()
        }
    };
};
exports.rootCommand = rootCommand;
//# sourceMappingURL=rootCommand.js.map