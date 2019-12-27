import { assert } from 'assertthat';
import { CustomError } from 'defekt';
import { uuid } from 'uuidv4';
import { validateAggregateIdentifier } from '../../../../lib/common/validators/validateAggregateIdentifier';

suite('validateAggregateIdentifier', (): void => {
  const aggregateIdentifier = {
    name: 'sampleAggregate',
    id: uuid()
  };

  test('does not throw an error if everything is fine.', async (): Promise<void> => {
    assert.that((): void => {
      validateAggregateIdentifier({ aggregateIdentifier });
    }).is.not.throwing();
  });

  test('throws an error if the item identifier does not match the item identifier schema.', async (): Promise<void> => {
    assert.that((): void => {
      validateAggregateIdentifier({
        aggregateIdentifier: ({
          name: '',
          id: uuid()
        }) as any
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'EAGGREGATEIDENTIFIERMALFORMED' &&
        ex.message === 'String is too short (0 chars), minimum 1 (at aggregateIdentifier.name).'
    );
  });
});
