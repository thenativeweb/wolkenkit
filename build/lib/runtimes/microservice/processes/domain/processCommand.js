"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processCommand = void 0;
const acknowledgeCommand_1 = require("./acknowledgeCommand");
const fetchCommand_1 = require("./fetchCommand");
const flaschenpost_1 = require("flaschenpost");
const getCommandWithMetadataSchema_1 = require("../../../../common/schemas/getCommandWithMetadataSchema");
const keepRenewingLock_1 = require("./keepRenewingLock");
const validate_value_1 = require("validate-value");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const errors = __importStar(require("../../../../common/errors"));
const logger = flaschenpost_1.flaschenpost.getLogger();
const commandWithMetadataParser = new validate_value_1.Parser(getCommandWithMetadataSchema_1.getCommandWithMetadataSchema());
const processCommand = async function ({ commandDispatcher, repository, publishDomainEvents }) {
    const { command, metadata } = await fetchCommand_1.fetchCommand({ commandDispatcher });
    logger.debug('Fetched and locked command for domain server.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/domain', { itemIdentifier: command.getItemIdentifier(), metadata }));
    try {
        commandWithMetadataParser.parse(command, { valueName: 'command' }).unwrapOrThrow((err) => new errors.CommandMalformed(err.message));
        const aggregateInstance = await repository.getAggregateInstance({
            aggregateIdentifier: command.aggregateIdentifier
        });
        const handleCommandPromise = aggregateInstance.handleCommand({ command });
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        (async () => {
            await keepRenewingLock_1.keepRenewingLock({ command, handleCommandPromise, commandDispatcher, token: metadata.token });
        })();
        const domainEvents = await handleCommandPromise;
        await publishDomainEvents({ domainEvents });
    }
    catch (ex) {
        logger.error('Failed to handle command.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/domain', { command, error: ex }));
    }
    finally {
        await acknowledgeCommand_1.acknowledgeCommand({ command, token: metadata.token, commandDispatcher });
        logger.debug('Processed and acknowledged command.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/domain', { itemIdentifier: command.getItemIdentifier(), metadata }));
    }
};
exports.processCommand = processCommand;
//# sourceMappingURL=processCommand.js.map