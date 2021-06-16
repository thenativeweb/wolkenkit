"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lockCommand = void 0;
const lockMongoDbCommand_1 = require("./lockMongoDbCommand");
const lockMySqlCommand_1 = require("./lockMySqlCommand");
const lockPostgresCommand_1 = require("./lockPostgresCommand");
const lockRedisCommand_1 = require("./lockRedisCommand");
const lockSqlServerCommand_1 = require("./lockSqlServerCommand");
const lockCommand = function () {
    return {
        name: 'lock',
        description: 'Set up a lock store.',
        optionDefinitions: [],
        handle({ getUsage, ancestors }) {
            /* eslint-disable no-console */
            console.log(getUsage({ commandPath: [...ancestors, 'lock'] }));
            /* eslint-enable no-console */
        },
        subcommands: {
            mongodb: lockMongoDbCommand_1.lockMongoDbCommand(),
            mysql: lockMySqlCommand_1.lockMySqlCommand(),
            postgres: lockPostgresCommand_1.lockPostgresCommand(),
            redis: lockRedisCommand_1.lockRedisCommand(),
            sqlserver: lockSqlServerCommand_1.lockSqlServerCommand()
        }
    };
};
exports.lockCommand = lockCommand;
//# sourceMappingURL=lockCommand.js.map