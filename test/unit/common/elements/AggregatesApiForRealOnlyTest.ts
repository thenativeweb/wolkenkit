import Aggregate from '../../../../src/common/elements/Aggregate';
import AggregateApiForReadOnly from '../../../../src/common/elements/AggregateApiForReadOnly';
import assert from 'assertthat';
import uuidv4 from 'uuidv4';

suite('AggregateApiForReadOnly', (): void => {
  suite('instance', (): void => {
    let aggregate: Aggregate;

    setup((): void => {
      aggregate = new Aggregate({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: uuidv4() },
        initialState: {
          foo: 'bar'
        }
      });
    });

    test('contains the aggregate\'s id and state.', async (): Promise<void> => {
      const aggregateApiForReadOnly = new AggregateApiForReadOnly({ aggregate });

      assert.that(aggregateApiForReadOnly.id).is.equalTo(aggregate.identifier.id);
      assert.that(aggregateApiForReadOnly.state).is.equalTo(aggregate.state);
    });

    test('exists returns false for a recently initialized aggregate.', async (): Promise<void> => {
      const aggregateApiForReadOnly = new AggregateApiForReadOnly({ aggregate });

      assert.that(aggregateApiForReadOnly.exists()).is.false();
    });

    test('exists returns true for an aggregate with revision > 0.', async (): Promise<void> => {
      aggregate.revision += 1;
      const aggregateApiForReadOnly = new AggregateApiForReadOnly({ aggregate });

      assert.that(aggregateApiForReadOnly.exists()).is.true();
    });
  });
});
