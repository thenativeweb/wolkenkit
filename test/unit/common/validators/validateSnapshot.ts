import { assert } from 'assertthat';
import { CustomError } from 'defekt';
import { uuid } from 'uuidv4';
import { validateSnapshot } from '../../../../lib/common/validators/validateSnapshot';

suite('validateSnapshot', (): void => {
  const snapshot = {
    aggregateIdentifier: {
      name: 'sampleAggregate',
      id: uuid()
    },
    revision: 1,
    state: {}
  };

  test('does not throw an error if everything is fine.', async (): Promise<void> => {
    assert.that((): void => {
      validateSnapshot({ snapshot });
    }).is.not.throwing();
  });

  test('throws an error if the item identifier does not match the item identifier schema.', async (): Promise<void> => {
    assert.that((): void => {
      validateSnapshot({
        snapshot: ({
          aggregateIdentifier: {
            name: '',
            id: uuid()
          },
          revision: 1,
          state: {}
        }) as any
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'ESNAPSHOTMALFORMEDERROR' &&
        ex.message === 'String is too short (0 chars), minimum 1 (at snapshot.aggregateIdentifier.name).'
    );
  });
});
