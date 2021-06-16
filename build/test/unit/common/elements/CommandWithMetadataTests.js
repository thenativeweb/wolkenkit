"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const CommandWithMetadata_1 = require("../../../../lib/common/elements/CommandWithMetadata");
const uuid_1 = require("uuid");
suite('CommandWithMetadata', () => {
    test('sets the given values.', async () => {
        const aggregateId = uuid_1.v4(), causationId = uuid_1.v4(), correlationId = uuid_1.v4(), id = uuid_1.v4(), timestamp = Date.now();
        const command = new CommandWithMetadata_1.CommandWithMetadata({
            aggregateIdentifier: {
                context: { name: 'sampleContext' },
                aggregate: { name: 'sampleAggregate', id: aggregateId }
            },
            name: 'sampleCommand',
            data: {
                strategy: 'succeed'
            },
            id,
            metadata: {
                causationId,
                correlationId,
                timestamp,
                client: { ip: '127.0.0.1', token: '...', user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
            }
        });
        assertthat_1.assert.that(command).is.equalTo({
            aggregateIdentifier: {
                context: { name: 'sampleContext' },
                aggregate: { name: 'sampleAggregate', id: aggregateId }
            },
            name: 'sampleCommand',
            data: {
                strategy: 'succeed'
            },
            id,
            metadata: {
                causationId,
                correlationId,
                timestamp,
                client: { ip: '127.0.0.1', token: '...', user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
            }
        });
    });
    suite('getItemIdentifier', () => {
        test('returns the item identifier for the command.', async () => {
            const aggregateId = uuid_1.v4(), causationId = uuid_1.v4(), correlationId = uuid_1.v4(), id = uuid_1.v4(), timestamp = Date.now();
            const command = new CommandWithMetadata_1.CommandWithMetadata({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: aggregateId }
                },
                name: 'sampleCommand',
                data: {
                    strategy: 'succeed'
                },
                id,
                metadata: {
                    causationId,
                    correlationId,
                    timestamp,
                    client: { ip: '127.0.0.1', token: '...', user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                    initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } }
                }
            });
            const itemIdentifier = command.getItemIdentifier();
            assertthat_1.assert.that(itemIdentifier).is.equalTo({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: aggregateId }
                },
                name: 'sampleCommand',
                id
            });
        });
    });
});
//# sourceMappingURL=CommandWithMetadataTests.js.map