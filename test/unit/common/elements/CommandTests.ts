import { assert } from 'assertthat';
import { Command } from '../../../../lib/common/elements/Command';
import { uuid } from 'uuidv4';

suite('Command', (): void => {
  test('sets the given values.', async (): Promise<void> => {
    const aggregateId = uuid();

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
