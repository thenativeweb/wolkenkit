"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const buildCommand_1 = require("../../../../lib/common/utils/test/buildCommand");
const buildDomainEvent_1 = require("../../../../lib/common/utils/test/buildDomainEvent");
const getCommandService_1 = require("../../../../lib/common/services/getCommandService");
const uuid_1 = require("../../../../lib/common/utils/uuid");
const uuid_2 = require("uuid");
suite('getCommandService', () => {
    test('calls onIssueCommand with the created command with metadata.', async () => {
        const issuedCommands = [];
        const onIssueCommand = ({ command }) => {
            issuedCommands.push(command);
        };
        const domainEvent = buildDomainEvent_1.buildDomainEvent({
            aggregateIdentifier: {
                context: { name: 'sampleContext' },
                aggregate: { name: 'sampleAggregate', id: uuid_2.v4() }
            },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
                initiator: {
                    user: { id: 'jane.doe', claims: { sub: 'jane.doe' } }
                },
                revision: 1
            }
        });
        const commandService = getCommandService_1.getCommandService({ domainEvent, issueCommand: onIssueCommand });
        const command = buildCommand_1.buildCommand({
            aggregateIdentifier: {
                context: { name: 'sampleContext' },
                aggregate: { name: 'sampleAggregate', id: uuid_2.v4() }
            },
            name: 'execute',
            data: { strategy: 'succeed' }
        });
        const initiator = {
            user: { id: 'john.doe', claims: { sub: 'john.doe' } }
        };
        const commandId = await commandService.issueCommand(command, initiator);
        assertthat_1.assert.that(commandId).is.matching(uuid_1.regex);
        assertthat_1.assert.that(issuedCommands.length).is.equalTo(1);
        assertthat_1.assert.that(issuedCommands[0]).is.atLeast({
            ...command,
            metadata: {
                causationId: domainEvent.id,
                correlationId: domainEvent.metadata.correlationId,
                client: {
                    ip: '127.0.0.1',
                    user: { id: 'flow', claims: { sub: 'flow' } }
                },
                initiator
            }
        });
    });
    test(`uses the domain event's initiator if none is given.`, async () => {
        const issuedCommands = [];
        const onIssueCommand = ({ command }) => {
            issuedCommands.push(command);
        };
        const domainEvent = buildDomainEvent_1.buildDomainEvent({
            aggregateIdentifier: {
                context: { name: 'sampleContext' },
                aggregate: { name: 'sampleAggregate', id: uuid_2.v4() }
            },
            name: 'executed',
            data: { strategy: 'succeed' },
            metadata: {
                initiator: {
                    user: { id: 'jane.doe', claims: { sub: 'jane.doe' } }
                },
                revision: 1
            }
        });
        const commandService = getCommandService_1.getCommandService({ domainEvent, issueCommand: onIssueCommand });
        const command = buildCommand_1.buildCommand({
            aggregateIdentifier: {
                context: { name: 'sampleContext' },
                aggregate: { name: 'sampleAggregate', id: uuid_2.v4() }
            },
            name: 'execute',
            data: { strategy: 'succeed' }
        });
        await commandService.issueCommand(command);
        assertthat_1.assert.that(issuedCommands.length).is.equalTo(1);
        assertthat_1.assert.that(issuedCommands[0].metadata.initiator).is.equalTo(domainEvent.metadata.initiator);
    });
});
//# sourceMappingURL=getCommandServiceTests.js.map