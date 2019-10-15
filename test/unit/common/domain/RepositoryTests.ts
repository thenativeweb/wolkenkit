import Aggregate from '../../../../src/common/elements/Aggregate';
import AggregateApiForCommands from '../../../../src/common/elements/AggregateApiForCommands';
import Application from '../../../../src/common/application/Application';
import assert from 'assertthat';
import cloneDeep from 'lodash/cloneDeep';
import CommandInternal from '../../../../src/common/elements/CommandInternal';
import EventInternal from '../../../../src/common/elements/EventInternal';
import { Eventstore } from '../../../../src/stores/eventstore/Eventstore';
import InMemoryEventstore from '../../../../src/stores/eventstore/InMemory';
import Repository from '../../../../src/common/domain/Repository';
import toArray from 'streamtoarray';
import updateInitialState from '../../../shared/applications/valid/updateInitialState';
import uuid from 'uuidv4';

suite('Repository', (): void => {
  let application: Application,
      eventstore: Eventstore;

  setup(async (): Promise<void> => {
    const directory = await updateInitialState();

    application = await Application.load({ directory });

    eventstore = await InMemoryEventstore.create();
  });

  teardown(async (): Promise<void> => {
    await eventstore.destroy();
  });

  suite('instance', (): void => {
    let aggregate: Aggregate,
        command: CommandInternal,
        repository: Repository;

    setup((): void => {
      repository = new Repository({ application, eventstore });

      command = CommandInternal.create({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
        name: 'execute',
        data: { strategy: 'succeed' },
        annotations: {
          client: { token: '...', user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}, ip: '127.0.0.1' },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      aggregate = new Aggregate({
        contextIdentifier: command.contextIdentifier,
        aggregateIdentifier: command.aggregateIdentifier,
        initialState: {
          events: []
        }
      });
    });

    suite('saveAggregate', (): void => {
      test('does nothing when there are no uncommitted events.', async (): Promise<void> => {
        await repository.saveAggregate({ aggregate });

        const eventStream = await eventstore.getEventStream({ aggregateIdentifier: aggregate.identifier });
        const events = await toArray(eventStream);

        assert.that(events.length).is.equalTo(0);
      });

      test('saves a single uncommitted event to the event store.', async (): Promise<void> => {
        const aggregateApiForCommands = new AggregateApiForCommands({ aggregate, application, repository, command });

        aggregateApiForCommands.publishEvent('executed', { strategy: 'succeed' });

        await repository.saveAggregate({ aggregate });

        const eventStream = await eventstore.getEventStream({ aggregateIdentifier: aggregate.identifier });
        const events = await toArray(eventStream);

        assert.that(events.length).is.equalTo(1);
        assert.that(events[0].name).is.equalTo('executed');
        assert.that(events[0].data).is.equalTo({ strategy: 'succeed' });
      });

      test('saves multiple uncommitted events to the event store.', async (): Promise<void> => {
        const aggregateApiForCommands = new AggregateApiForCommands({ aggregate, application, repository, command });

        aggregateApiForCommands.publishEvent('succeeded');
        aggregateApiForCommands.publishEvent('executed', { strategy: 'succeed' });

        await repository.saveAggregate({ aggregate });

        const eventStream = await eventstore.getEventStream({ aggregateIdentifier: aggregate.identifier });
        const events = await toArray(eventStream);

        assert.that(events.length).is.equalTo(2);
        assert.that(events[0].name).is.equalTo('succeeded');
        assert.that(events[0].data).is.equalTo({});
        assert.that(events[1].name).is.equalTo('executed');
        assert.that(events[1].data).is.equalTo({ strategy: 'succeed' });
      });

      test('returns the committed events from the event store.', async (): Promise<void> => {
        const aggregateApiForCommands = new AggregateApiForCommands({ aggregate, application, repository, command });

        aggregateApiForCommands.publishEvent('succeeded');
        aggregateApiForCommands.publishEvent('executed', { strategy: 'succeed' });

        const committedEvents = await repository.saveAggregate({ aggregate });

        assert.that(committedEvents.length).is.equalTo(2);
        assert.that(committedEvents[0].metadata.revision.global).is.ofType('number');
        assert.that(committedEvents[1].metadata.revision.global).is.ofType('number');
        assert.that(committedEvents[0].metadata.revision.global! + 1).is.equalTo(
          committedEvents[1].metadata.revision.global
        );
      });

      test('returns an empty list of committed events when there were no uncommited events.', async (): Promise<void> => {
        const committedEvents = await repository.saveAggregate({ aggregate });

        assert.that(committedEvents).is.equalTo([]);
      });
    });

    suite('replayAggregate', (): void => {
      test('returns the aggregate as-is if no events have been saved.', async (): Promise<void> => {
        const oldState = cloneDeep(aggregate.state);

        const aggregateReplayed = await repository.replayAggregate({ aggregate });

        assert.that(aggregateReplayed.state).is.equalTo(oldState);
      });

      test('throws an error if the aggregate type does not match the events.', async (): Promise<void> => {
        const succeeded = EventInternal.create({
          contextIdentifier: aggregate.contextIdentifier,
          aggregateIdentifier: aggregate.identifier,
          name: 'succeeded',
          metadata: {
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
            causationId: uuid(),
            correlationId: uuid(),
            revision: { aggregate: 1 }
          },
          annotations: { state: {}, previousState: {}}
        });
        const nonExistent = EventInternal.create({
          contextIdentifier: aggregate.contextIdentifier,
          aggregateIdentifier: aggregate.identifier,
          name: 'nonExistent',
          metadata: {
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
            causationId: uuid(),
            correlationId: uuid(),
            revision: { aggregate: 2 }
          },
          annotations: { state: {}, previousState: {}}
        });

        await eventstore.saveEvents({
          uncommittedEvents: [ succeeded, nonExistent ]
        });

        await assert.that(async (): Promise<void> => {
          await repository.replayAggregate({ aggregate });
        }).is.throwingAsync(`Failed to apply unknown event 'nonExistent' in 'sampleContext.sampleAggregate'.`);
      });

      test('applies previously saved events.', async (): Promise<void> => {
        const succeeded = EventInternal.create({
          contextIdentifier: aggregate.contextIdentifier,
          aggregateIdentifier: aggregate.identifier,
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
          contextIdentifier: aggregate.contextIdentifier,
          aggregateIdentifier: aggregate.identifier,
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

        const aggregateReplayed = await repository.replayAggregate({ aggregate });

        assert.that(aggregateReplayed.state).is.equalTo({
          events: [ 'succeeded', 'executed' ]
        });
      });

      test('applies previously saved snapshots and events.', async (): Promise<void> => {
        const succeeded = EventInternal.create({
          contextIdentifier: aggregate.contextIdentifier,
          aggregateIdentifier: aggregate.identifier,
          name: 'succeeded',
          metadata: {
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
            causationId: uuid(),
            correlationId: uuid(),
            revision: { aggregate: 100 }
          },
          annotations: { state: { events: [ 'succeeded', 'succeeded', 'succeeded' ]}, previousState: {}}
        });
        const executed = EventInternal.create({
          contextIdentifier: aggregate.contextIdentifier,
          aggregateIdentifier: aggregate.identifier,
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: {
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
            causationId: uuid(),
            correlationId: uuid(),
            revision: { aggregate: 101 }
          },
          annotations: { state: {}, previousState: {}}
        });

        await eventstore.saveEvents({
          uncommittedEvents: [ succeeded, executed ]
        });

        const aggregateReplayed = await repository.replayAggregate({ aggregate });

        assert.that(aggregateReplayed.state).is.equalTo({
          events: [ 'succeeded', 'succeeded', 'succeeded', 'executed' ]
        });
      });
    });

    suite('loadAggregate', (): void => {
      test('returns a replayed aggregate.', async (): Promise<void> => {
        const succeeded = EventInternal.create({
          contextIdentifier: aggregate.contextIdentifier,
          aggregateIdentifier: aggregate.identifier,
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
          contextIdentifier: aggregate.contextIdentifier,
          aggregateIdentifier: aggregate.identifier,
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

        const loadedAggregate = await repository.loadAggregate({
          contextIdentifier: aggregate.contextIdentifier,
          aggregateIdentifier: aggregate.identifier
        });

        assert.that(loadedAggregate).is.instanceOf(Aggregate);
        assert.that(loadedAggregate.state).is.equalTo({
          events: [ 'succeeded', 'executed' ]
        });
      });
    });
  });
});
