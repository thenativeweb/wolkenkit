"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const DomainEvent_1 = require("../../../../lib/common/elements/DomainEvent");
const uuid_1 = require("uuid");
suite('DomainEvent', () => {
    test('sets the given values.', async () => {
        const aggregateId = uuid_1.v4(), causationId = uuid_1.v4(), correlationId = uuid_1.v4(), id = uuid_1.v4(), timestamp = Date.now();
        const domainEvent = new DomainEvent_1.DomainEvent({
            aggregateIdentifier: {
                context: { name: 'sampleContext' },
                aggregate: { name: 'sampleAggregate', id: aggregateId }
            },
            name: 'succeeded',
            data: {
                strategy: 'succeed'
            },
            id,
            metadata: {
                causationId,
                correlationId,
                timestamp,
                revision: 23,
                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                tags: ['gdpr']
            }
        });
        assertthat_1.assert.that(domainEvent).is.equalTo({
            aggregateIdentifier: {
                context: { name: 'sampleContext' },
                aggregate: { name: 'sampleAggregate', id: aggregateId }
            },
            name: 'succeeded',
            data: {
                strategy: 'succeed'
            },
            id,
            metadata: {
                causationId,
                correlationId,
                timestamp,
                revision: 23,
                initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                tags: ['gdpr']
            }
        });
    });
    suite('getItemIdentifier', () => {
        test('returns the item identifier for the domain event.', async () => {
            const aggregateId = uuid_1.v4(), causationId = uuid_1.v4(), correlationId = uuid_1.v4(), id = uuid_1.v4(), timestamp = Date.now();
            const domainEvent = new DomainEvent_1.DomainEvent({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: aggregateId }
                },
                name: 'succeeded',
                data: {
                    strategy: 'succeed'
                },
                id,
                metadata: {
                    causationId,
                    correlationId,
                    timestamp,
                    revision: 23,
                    initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' } } },
                    tags: []
                }
            });
            const itemIdentifier = domainEvent.getItemIdentifier();
            assertthat_1.assert.that(itemIdentifier).is.equalTo({
                aggregateIdentifier: {
                    context: { name: 'sampleContext' },
                    aggregate: { name: 'sampleAggregate', id: aggregateId }
                },
                name: 'succeeded',
                id
            });
        });
    });
});
//# sourceMappingURL=DomainEventTests.js.map