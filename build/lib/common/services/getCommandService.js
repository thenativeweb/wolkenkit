"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommandService = void 0;
const CommandWithMetadata_1 = require("../elements/CommandWithMetadata");
const limes_1 = require("limes");
const uuid_1 = require("uuid");
const getCommandService = function ({ domainEvent, issueCommand }) {
    return {
        async issueCommand(command, initiator) {
            const commandWithMetadata = new CommandWithMetadata_1.CommandWithMetadata({
                ...command,
                id: uuid_1.v4(),
                metadata: {
                    causationId: domainEvent.id,
                    correlationId: domainEvent.metadata.correlationId,
                    timestamp: Date.now(),
                    initiator: initiator !== null && initiator !== void 0 ? initiator : domainEvent.metadata.initiator,
                    client: {
                        ip: '127.0.0.1',
                        token: limes_1.Limes.issueUntrustedToken({ issuer: 'https://token.invalid', subject: 'flow' }).token,
                        user: { id: 'flow', claims: { sub: 'flow' } }
                    }
                }
            });
            await issueCommand({ command: commandWithMetadata });
            return commandWithMetadata.id;
        }
    };
};
exports.getCommandService = getCommandService;
//# sourceMappingURL=getCommandService.js.map