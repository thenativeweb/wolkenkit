"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assertthat_1 = require("assertthat");
const DomainEventWithState_1 = require("../../../../lib/common/elements/DomainEventWithState");
const uuid_1 = require("uuid");
suite('DomainEventWithState', () => {
    test('sets the given values.', async () => {
        const aggregateId = uuid_1.v4(), causationId = uuid_1.v4(), correlationId = uuid_1.v4(), id = uuid_1.v4(), timestamp = Date.now();
        const domainEvent = new DomainEventWithState_1.DomainEventWithState({
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
            },
            state: { previous: { foo: 'bar' }, next: { foo: 'bas' } }
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
            },
            state: { previous: { foo: 'bar' }, next: { foo: 'bas' } }
        });
    });
});
//# sourceMappingURL=DomainEventWithStateTests.js.map