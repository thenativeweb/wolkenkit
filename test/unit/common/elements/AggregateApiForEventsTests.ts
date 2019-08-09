import Aggregate from '../../../../src/common/elements/Aggregate';
import AggregateApiForEvents from '../../../../src/common/elements/AggregateApiForEvents';
import assert from 'assertthat';
import uuidv4 from 'uuidv4';

suite('AggregateApiForEvents', (): void => {
  suite('instance', (): void => {
    let aggregate: Aggregate;

    setup((): void => {
      aggregate = new Aggregate({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: uuidv4() },
        initialState: {
          foo: 'bar',
          bas: [ 'bax' ],
          bay: { baz: 'bat' },
          bap: 'bao'
        }
      });
    });

    suite('setState', (): void => {
      test(`merges the given state into the aggregate's current state.`, async (): Promise<void> => {
        const aggregateApiForEvents = new AggregateApiForEvents({ aggregate });

        aggregateApiForEvents.setState({
          foo: 'baz',
          bas: [ 'baxx' ],
          bay: { baq: 'bal' }
        });

        assert.that(aggregate.state).is.equalTo({
          foo: 'baz',
          bas: [ 'baxx' ],
          bay: { baq: 'bal' },
          bap: 'bao'
        });
      });
    });
  });
});
