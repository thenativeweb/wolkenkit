import Aggregate from '../../../../src/common/elements/Aggregate';
import AggregateApiForEvents from '../../../../src/common/elements/AggregateApiForEvents';
import assert from 'assertthat';
import uuid from 'uuidv4';

suite('AggregateApiForEvents', (): void => {
  let aggregate: Aggregate;

  setup(async (): Promise<void> => {
    aggregate = new Aggregate({
      contextIdentifier: { name: 'sampleContext' },
      aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
      initialState: {}
    });
  });

  suite('setState', (): void => {
    test(`merges the given state into the aggregate's current state.`, async (): Promise<void> => {
      const aggregateApiForEvents = new AggregateApiForEvents({ aggregate });

      aggregateApiForEvents.setState({
        events: [ 'succeeded' ]
      });

      assert.that(aggregate.state).is.equalTo({
        events: [ 'succeeded' ]
      });
    });

    test('correctly resets arrays.', async (): Promise<void> => {
      const aggregateApiForEvents = new AggregateApiForEvents({ aggregate });

      aggregateApiForEvents.setState({
        events: [ 'succeeded' ]
      });
      aggregateApiForEvents.setState({
        events: []
      });

      assert.that(aggregate.state).is.equalTo({
        events: []
      });
    });
  });
});
