"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.domainEventCommand = void 0;
const domainEventMongoDbCommand_1 = require("./domainEventMongoDbCommand");
const domainEventMySqlCommand_1 = require("./domainEventMySqlCommand");
const domainEventPostgresCommand_1 = require("./domainEventPostgresCommand");
const domainEventSqlServerCommand_1 = require("./domainEventSqlServerCommand");
const domainEventCommand = function () {
    return {
        name: 'domain-event',
        description: 'Set up a domain event store.',
        optionDefinitions: [],
        handle({ getUsage, ancestors }) {
            /* eslint-disable no-console */
            console.log(getUsage({ commandPath: [...ancestors, 'domain-event'] }));
            /* eslint-enable no-console */
        },
        subcommands: {
            mongodb: domainEventMongoDbCommand_1.domainEventMongoDbCommand(),
            mysql: domainEventMySqlCommand_1.domainEventMySqlCommand(),
            postgres: domainEventPostgresCommand_1.domainEventPostgresCommand(),
            sqlserver: domainEventSqlServerCommand_1.domainEventSqlServerCommand()
        }
    };
};
exports.domainEventCommand = domainEventCommand;
//# sourceMappingURL=domainEventCommand.js.map