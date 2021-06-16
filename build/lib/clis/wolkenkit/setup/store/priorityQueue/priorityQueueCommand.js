"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.priorityQueueCommand = void 0;
const priorityQueueMongoDbCommand_1 = require("./priorityQueueMongoDbCommand");
const priorityQueueMySqlCommand_1 = require("./priorityQueueMySqlCommand");
const priorityQueuePostgresCommand_1 = require("./priorityQueuePostgresCommand");
const priorityQueueSqlServerCommand_1 = require("./priorityQueueSqlServerCommand");
const priorityQueueCommand = function () {
    return {
        name: 'priority-queue',
        description: 'Set up a priority queue store.',
        optionDefinitions: [],
        handle({ getUsage, ancestors }) {
            /* eslint-disable no-console */
            console.log(getUsage({ commandPath: [...ancestors, 'priority-queue'] }));
            /* eslint-enable no-console */
        },
        subcommands: {
            mongodb: priorityQueueMongoDbCommand_1.priorityQueueMongoDbCommand(),
            mysql: priorityQueueMySqlCommand_1.priorityQueueMySqlCommand(),
            postgres: priorityQueuePostgresCommand_1.priorityQueuePostgresCommand(),
            sqlserver: priorityQueueSqlServerCommand_1.priorityQueueSqlServerCommand()
        }
    };
};
exports.priorityQueueCommand = priorityQueueCommand;
//# sourceMappingURL=priorityQueueCommand.js.map