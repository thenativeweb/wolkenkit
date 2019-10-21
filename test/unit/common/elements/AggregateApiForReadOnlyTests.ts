import Aggregate from '../../../../lib/common/elements/Aggregate';
import AggregateApiForReadOnly from '../../../../lib/common/elements/AggregateApiForReadOnly';
import assert from 'assertthat';
import uuid from 'uuidv4';

suite('AggregateApiForReadOnly', (): void => {
  let aggregate: Aggregate;

  setup(async (): Promise<void> => {
    aggregate = new Aggregate({
      contextIdentifier: { name: 'sampleContext' },
      aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
      initialState: {
        foo: 'bar'
      }
    });
  });

  suite('id', (): void => {
    test('contains the aggregate id.', async (): Promise<void> => {
      const aggregateApiForReadOnly = new AggregateApiForReadOnly({ aggregate });

      assert.that(aggregateApiForReadOnly.id).is.equalTo(aggregate.identifier.id);
    });
  });

  suite('state', (): void => {
    test('contains the aggregate state.', async (): Promise<void> => {
      const aggregateApiForReadOnly = new AggregateApiForReadOnly({ aggregate });

      assert.that(aggregateApiForReadOnly.state).is.equalTo(aggregate.state);
    });
  });

  suite('exists', (): void => {
    test('returns false for a recently initialized aggregate.', async (): Promise<void> => {
      const aggregateApiForReadOnly = new AggregateApiForReadOnly({ aggregate });

      assert.that(aggregateApiForReadOnly.exists()).is.false();
    });

    test('returns true for an aggregate with revision > 0.', async (): Promise<void> => {
      aggregate.revision += 1;
      const aggregateApiForReadOnly = new AggregateApiForReadOnly({ aggregate });

      assert.that(aggregateApiForReadOnly.exists()).is.true();
    });
  });
});
