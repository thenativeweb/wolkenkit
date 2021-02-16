import { assert } from 'assertthat';
import { DomainEvent } from '../../../../lib/common/elements/DomainEvent';
import { v4 } from 'uuid';

suite('DomainEvent', (): void => {
  test('sets the given values.', async (): Promise<void> => {
    const aggregateId = v4(),
          causationId = v4(),
          correlationId = v4(),
          id = v4(),
          timestamp = Date.now();

    const domainEvent = new DomainEvent({
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
        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
        tags: [ 'gdpr' ]
      }
    });

    assert.that(domainEvent).is.equalTo({
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
        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
        tags: [ 'gdpr' ]
      }
    });
  });

  suite('getItemIdentifier', (): void => {
    test('returns the item identifier for the domain event.', async (): Promise<void> => {
      const aggregateId = v4(),
            causationId = v4(),
            correlationId = v4(),
            id = v4(),
            timestamp = Date.now();

      const domainEvent = new DomainEvent({
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
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
          tags: []
        }
      });

      const itemIdentifier = domainEvent.getItemIdentifier();

      assert.that(itemIdentifier).is.equalTo({
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
