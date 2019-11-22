import { assert } from 'assertthat';
import { DomainEvent } from '../../../../lib/common/elements/DomainEvent';
import { uuid } from 'uuidv4';

suite('DomainEvent', (): void => {
  test('sets the given values.', async (): Promise<void> => {
    const aggregateId = uuid(),
          causationId = uuid(),
          correlationId = uuid(),
          id = uuid(),
          timestamp = Date.now();

    const domainEvent = new DomainEvent({
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
        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
      }
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
        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
      }
    });
  });
});
