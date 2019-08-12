import Aggregate from '../../../../src/common/elements/Aggregate';
import { AggregateIdentifier } from '../../../../src/common/elements/AggregateIdentifier';
import Application from '../../../../src/common/application/Application';
import assert from 'assertthat';
import EventInternal from '../../../../src/common/elements/EventInternal';
import { Eventstore } from '../../../../src/stores/eventstore/Eventstore';
import InMemoryEventstore from '../../../../src/stores/eventstore/InMemory';
import { PassThrough } from 'stream';
import uuid from 'uuidv4';
import validUpdateInitialState from '../../../shared/applications/valid/updateInitialState';

suite('Aggregate', (): void => {
  let aggregateIdentifier: AggregateIdentifier;

  setup(async (): Promise<void> => {
    aggregateIdentifier = {
      id: uuid(),
      name: 'sampleAggregate'
    };
  });

  suite('contextIdentifier', (): void => {
    test('contains the requested aggregate\'s context identifier.', async (): Promise<void> => {
      const contextName = 'sampleContext';

      const aggregate = new Aggregate({
        contextIdentifier: { name: contextName },
        aggregateIdentifier,
        initialState: {}
      });

      assert.that(aggregate.contextIdentifier.name).is.equalTo(contextName);
    });
  });

  suite('identifier', (): void => {
    test('contains the requested aggregate\'s identifier.', async (): Promise<void> => {
      const aggregate = new Aggregate({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier,
        initialState: {}
      });

      assert.that(aggregate.identifier.name).is.equalTo(aggregateIdentifier.name);
      assert.that(aggregate.identifier.id).is.equalTo(aggregateIdentifier.id);
    });
  });

  suite('revision', (): void => {
    test('is 0.', async (): Promise<void> => {
      const aggregate = new Aggregate({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
        initialState: {}
      });

      assert.that(aggregate.revision).is.equalTo(0);
    });
  });

  suite('uncommitted events', (): void => {
    test('is an empty array.', async (): Promise<void> => {
      const aggregate = new Aggregate({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier,
        initialState: {}
      });

      assert.that(aggregate.uncommittedEvents).is.equalTo([]);
    });
  });

  suite('state', (): void => {
    test('is a deep copy of the initial state.', async (): Promise<void> => {
      const initialState = {
        foo: 'bar',
        fop: {
          foq: 'bas'
        }
      };
      const aggregate = new Aggregate({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier,
        initialState
      });

      assert.that(aggregate.state).is.equalTo(initialState);
      assert.that(aggregate.state).is.not.sameAs(initialState);
    });
  });

  suite('exists', (): void => {
    test('returns false if revision is 0.', async (): Promise<void> => {
      const aggregate = new Aggregate({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier,
        initialState: {}
      });

      assert.that(aggregate.exists()).is.false();
    });

    test('returns true if revision is greater than 0.', async (): Promise<void> => {
      const aggregate = new Aggregate({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier,
        initialState: {}
      });

      const snapshot = {
        aggregateIdentifier,
        revision: 23,
        state: { initiator: 'Jane Doe', destination: 'Riva', participants: [ 'Jane Doe' ]}
      };

      aggregate.applySnapshot({ snapshot });

      assert.that(aggregate.exists()).is.true();
    });
  });

  suite('applySnapshot', (): void => {
    test('overwrites the revision.', async (): Promise<void> => {
      const aggregate = new Aggregate({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier,
        initialState: {}
      });

      const snapshot = {
        aggregateIdentifier,
        revision: 23,
        state: { initiator: 'Jane Doe', destination: 'Riva', participants: [ 'Jane Doe' ]}
      };

      aggregate.applySnapshot({ snapshot });

      assert.that(aggregate.revision).is.equalTo(23);
    });

    test('overwrites the state.', async (): Promise<void> => {
      const aggregate = new Aggregate({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier,
        initialState: {}
      });

      const snapshot = {
        aggregateIdentifier,
        revision: 23,
        state: { initiator: 'Jane Doe', destination: 'Riva', participants: [ 'Jane Doe' ]}
      };

      aggregate.applySnapshot({ snapshot });

      assert.that(aggregate.state).is.equalTo(snapshot.state);
      assert.that(aggregate.state).is.sameAs(snapshot.state);
    });
  });

  suite('applyEventStream', (): void => {
    let aggregate: Aggregate,
        application: Application,
        eventstore: Eventstore,
        eventStream: PassThrough;

    setup(async (): Promise<void> => {
      const directory = await validUpdateInitialState();

      application = await Application.load({ directory });

      aggregateIdentifier = {
        id: uuid(),
        name: 'sampleAggregate'
      };

      eventstore = new InMemoryEventstore();
      await eventstore.initialize();

      const succeeded = EventInternal.create({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier,
        name: 'succeeded',
        metadata: {
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
          causationId: uuid(),
          correlationId: uuid(),
          revision: { aggregate: 1 }
        },
        annotations: { state: {}, previousState: {}}
      });
      const executed = EventInternal.create({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier,
        name: 'executed',
        data: { strategy: 'succeed' },
        metadata: {
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
          causationId: uuid(),
          correlationId: uuid(),
          revision: { aggregate: 2 }
        },
        annotations: { state: {}, previousState: {}}
      });

      await eventstore.saveEvents({
        uncommittedEvents: [ succeeded, executed ]
      });

      aggregate = new Aggregate({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier,
        initialState: {
          events: []
        }
      });
      eventStream = await eventstore.getEventStream({ aggregateIdentifier });
    });

    teardown(async (): Promise<void> => {
      await eventstore.destroy();
    });

    test('throws an error if the context name does not match.', async (): Promise<void> => {
      const event = EventInternal.create({
        contextIdentifier: { name: 'nonExistent' },
        aggregateIdentifier,
        name: 'executed',
        data: { strategy: 'succeed' },
        metadata: {
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
          causationId: uuid(),
          correlationId: uuid(),
          revision: { aggregate: 3 }
        },
        annotations: { state: {}, previousState: {}}
      });

      await eventstore.saveEvents({
        uncommittedEvents: [ event ]
      });

      eventStream = await eventstore.getEventStream({ aggregateIdentifier });

      await assert.that(async (): Promise<void> => {
        await aggregate.applyEventStream({
          application,
          eventStream
        });
      }).is.throwingAsync('Context name does not match.');
    });

    test('throws an error if the aggregate name does not match.', async (): Promise<void> => {
      const aggregateIdentifierWithWrongName = { name: 'nonExistent', id: aggregateIdentifier.id };
      const event = EventInternal.create({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: aggregateIdentifierWithWrongName,
        name: 'executed',
        data: { strategy: 'succeed' },
        metadata: {
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
          causationId: uuid(),
          correlationId: uuid(),
          revision: { aggregate: 3 }
        },
        annotations: { state: {}, previousState: {}}
      });

      await eventstore.saveEvents({
        uncommittedEvents: [ event ]
      });

      eventStream = await eventstore.getEventStream({ aggregateIdentifier: aggregateIdentifierWithWrongName });

      await assert.that(async (): Promise<void> => {
        await aggregate.applyEventStream({
          application,
          eventStream
        });
      }).is.throwingAsync('Aggregate name does not match.');
    });

    test('throws an error if the aggregate id does not match.', async (): Promise<void> => {
      const aggregateIdentifierWithWrongId = { name: 'sampleAggregate', id: uuid() };
      const event = EventInternal.create({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: aggregateIdentifierWithWrongId,
        name: 'executed',
        data: { strategy: 'succeed' },
        metadata: {
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
          causationId: uuid(),
          correlationId: uuid(),
          revision: { aggregate: 1 }
        },
        annotations: { state: {}, previousState: {}}
      });

      await eventstore.saveEvents({
        uncommittedEvents: [ event ]
      });

      eventStream = await eventstore.getEventStream({ aggregateIdentifier: aggregateIdentifierWithWrongId });

      await assert.that(async (): Promise<void> => {
        await aggregate.applyEventStream({
          application,
          eventStream
        });
      }).is.throwingAsync('Aggregate id does not match.');
    });

    test('throws an error if an unknown event name is given.', async (): Promise<void> => {
      const event = EventInternal.create({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier,
        name: 'nonExistent',
        data: { strategy: 'succeed' },
        metadata: {
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
          causationId: uuid(),
          correlationId: uuid(),
          revision: { aggregate: 3 }
        },
        annotations: { state: {}, previousState: {}}
      });

      await eventstore.saveEvents({
        uncommittedEvents: [ event ]
      });

      eventStream = await eventstore.getEventStream({ aggregateIdentifier });

      await assert.that(async (): Promise<void> => {
        await aggregate.applyEventStream({
          application,
          eventStream
        });
      }).is.throwingAsync(`Failed to apply unknown event 'nonExistent' in 'sampleContext.sampleAggregate'.`);
    });

    test('applies the event stream.', async (): Promise<void> => {
      await aggregate.applyEventStream({
        application,
        eventStream
      });

      assert.that(aggregate.state).is.equalTo({
        events: [ 'succeeded', 'executed' ]
      });
      assert.that(aggregate.revision).is.equalTo(2);
    });
  });
});
