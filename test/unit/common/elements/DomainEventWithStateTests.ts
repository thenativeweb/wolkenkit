import { assert } from 'assertthat';
import { DomainEventWithState } from '../../../../lib/common/elements/DomainEventWithState';
import { uuid } from 'uuidv4';

suite('DomainEventWithState', (): void => {
  test('sets the given values.', async (): Promise<void> => {
    const aggregateId = uuid(),
          causationId = uuid(),
          correlationId = uuid(),
          id = uuid(),
          timestamp = Date.now();

    const domainEvent = new DomainEventWithState({
      contextIdentifier: { name: 'sampleContext' },
      aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
      name: 'succeeded',
      data: {
        strategy: 'succeed'
      },
      id,
      metadata: {
        causationId,
        correlationId,
        timestamp,
        isPublished: true,
        revision: { aggregate: 23, global: 42 },
        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
        tags: [ 'gdpr' ]
      },
      state: { previous: { foo: 'bar' }, next: { foo: 'bas' }}
    });

    assert.that(domainEvent).is.equalTo({
      contextIdentifier: { name: 'sampleContext' },
      aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
      name: 'succeeded',
      data: {
        strategy: 'succeed'
      },
      id,
      metadata: {
        causationId,
        correlationId,
        timestamp,
        isPublished: true,
        revision: { aggregate: 23, global: 42 },
        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
        tags: [ 'gdpr' ]
      },
      state: { previous: { foo: 'bar' }, next: { foo: 'bas' }}
    });
  });
});
