"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeCommand = void 0;
const consumerProgressCommand_1 = require("./consumerProgress/consumerProgressCommand");
const domainEventCommand_1 = require("./domainEvent/domainEventCommand");
const fileCommand_1 = require("./file/fileCommand");
const lockCommand_1 = require("./lock/lockCommand");
const priorityQueueCommand_1 = require("./priorityQueue/priorityQueueCommand");
const storeCommand = function () {
    return {
        name: 'store',
        description: 'Set up stores.',
        optionDefinitions: [],
        handle({ getUsage, ancestors }) {
            /* eslint-disable no-console */
            console.log(getUsage({ commandPath: [...ancestors, 'store'] }));
            /* eslint-enable no-console */
        },
        subcommands: {
            'consumer-progress': consumerProgressCommand_1.consumerProgressCommand(),
            'domain-event': domainEventCommand_1.domainEventCommand(),
            file: fileCommand_1.fileCommand(),
            lock: lockCommand_1.lockCommand(),
            'priority-queue': priorityQueueCommand_1.priorityQueueCommand()
        }
    };
};
exports.storeCommand = storeCommand;
//# sourceMappingURL=storeCommand.js.map