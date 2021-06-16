"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acknowledgeCommand = void 0;
const acknowledgeCommand = async function ({ command, token, priorityQueue }) {
    await priorityQueue.store.acknowledge({
        discriminator: command.aggregateIdentifier.aggregate.id,
        token
    });
};
exports.acknowledgeCommand = acknowledgeCommand;
//# sourceMappingURL=acknowledgeCommand.js.map