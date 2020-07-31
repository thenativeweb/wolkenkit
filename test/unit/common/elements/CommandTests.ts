import { assert } from 'assertthat';
import { Command } from '../../../../lib/common/elements/Command';
import { v4 } from 'uuid';

suite('Command', (): void => {
  test('sets the given values.', async (): Promise<void> => {
    const aggregateId = v4();

    const command = new Command({
      contextIdentifier: { name: 'sampleContext' },
      aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
      name: 'sampleCommand',
      data: {
        strategy: 'succeed'
      }
    });

    assert.that(command).is.equalTo({
      contextIdentifier: { name: 'sampleContext' },
      aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
      name: 'sampleCommand',
      data: {
        strategy: 'succeed'
      }
    });
  });
});
