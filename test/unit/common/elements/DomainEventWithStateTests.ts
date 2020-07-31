import { assert } from 'assertthat';
import { DomainEventWithState } from '../../../../lib/common/elements/DomainEventWithState';
import { v4 } from 'uuid';

suite('DomainEventWithState', (): void => {
  test('sets the given values.', async (): Promise<void> => {
    const aggregateId = v4(),
          causationId = v4(),
          correlationId = v4(),
          id = v4(),
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
        revision: 23,
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
        revision: 23,
        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
        tags: [ 'gdpr' ]
      },
      state: { previous: { foo: 'bar' }, next: { foo: 'bas' }}
    });
  });
});
