import { assert } from 'assertthat';
import { CommandWithMetadata } from '../../../../lib/common/elements/CommandWithMetadata';
import { uuid } from 'uuidv4';

suite('CommandWithMetadata', (): void => {
  test('sets the given values.', async (): Promise<void> => {
    const aggregateId = uuid(),
          causationId = uuid(),
          correlationId = uuid(),
          id = uuid(),
          timestamp = Date.now();

    const command = new CommandWithMetadata({
      contextIdentifier: { name: 'sampleContext' },
      aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
      name: 'sampleCommand',
      data: {
        strategy: 'succeed'
      },
      id,
      metadata: {
        causationId,
        correlationId,
        timestamp,
        client: { ip: '127.0.0.1', token: '...', user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
      }
    });

    assert.that(command).is.equalTo({
      contextIdentifier: { name: 'sampleContext' },
      aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
      name: 'sampleCommand',
      data: {
        strategy: 'succeed'
      },
      id,
      metadata: {
        causationId,
        correlationId,
        timestamp,
        client: { ip: '127.0.0.1', token: '...', user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
      }
    });
  });

  suite('getItemIdentifier', (): void => {
    test('returns the item identifier for the command.', async (): Promise<void> => {
      const aggregateId = uuid(),
            causationId = uuid(),
            correlationId = uuid(),
            id = uuid(),
            timestamp = Date.now();

      const command = new CommandWithMetadata({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        name: 'sampleCommand',
        data: {
          strategy: 'succeed'
        },
        id,
        metadata: {
          causationId,
          correlationId,
          timestamp,
          client: { ip: '127.0.0.1', token: '...', user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      const itemIdentifier = command.getItemIdentifier();

      assert.that(itemIdentifier).is.equalTo({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        name: 'sampleCommand',
        id
      });
    });
  });
});
