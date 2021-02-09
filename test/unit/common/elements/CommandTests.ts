import { assert } from 'assertthat';
import { Command } from '../../../../lib/common/elements/Command';
import { v4 } from 'uuid';

suite('Command', (): void => {
  test('sets the given values.', async (): Promise<void> => {
    const aggregateId = v4();

    const command = new Command({
      aggregateIdentifier: {
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: aggregateId }
      },
      name: 'sampleCommand',
      data: {
        strategy: 'succeed'
      }
    });

    assert.that(command).is.equalTo({
      aggregateIdentifier: {
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: aggregateId }
      },
      name: 'sampleCommand',
      data: {
        strategy: 'succeed'
      }
    });
  });
});
