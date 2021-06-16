"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consumerProgressCommand = void 0;
const consumerProgressMongoDbCommand_1 = require("./consumerProgressMongoDbCommand");
const consumerProgressMySqlCommand_1 = require("./consumerProgressMySqlCommand");
const consumerProgressPostgresCommand_1 = require("./consumerProgressPostgresCommand");
const consumerProgressSqlServerCommand_1 = require("./consumerProgressSqlServerCommand");
const consumerProgressCommand = function () {
    return {
        name: 'consumer-progress',
        description: 'Set up a consumer progress store.',
        optionDefinitions: [],
        handle({ getUsage, ancestors }) {
            /* eslint-disable no-console */
            console.log(getUsage({ commandPath: [...ancestors, 'consumer-progress'] }));
            /* eslint-enable no-console */
        },
        subcommands: {
            mongodb: consumerProgressMongoDbCommand_1.consumerProgressMongoDbCommand(),
            mysql: consumerProgressMySqlCommand_1.consumerProgressMySqlCommand(),
            postgres: consumerProgressPostgresCommand_1.consumerProgressPostgresCommand(),
            sqlserver: consumerProgressSqlServerCommand_1.consumerProgressSqlServerCommand()
        }
    };
};
exports.consumerProgressCommand = consumerProgressCommand;
//# sourceMappingURL=consumerProgressCommand.js.map