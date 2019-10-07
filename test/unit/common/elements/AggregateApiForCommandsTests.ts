import Aggregate from '../../../../src/common/elements/Aggregate';
import AggregateApiForCommands from '../../../../src/common/elements/AggregateApiForCommands';
import AggregateApiForReadOnly from '../../../../src/common/elements/AggregateApiForReadOnly';
import Application from '../../../../src/common/application';
import assert from 'assertthat';
import CommandInternal from '../../../../src/common/elements/CommandInternal';
import Eventstore from '../../../../src/stores/eventstore/InMemory';
import path from 'path';
import Repository from '../../../../src/common/domain/Repository';
import sinon from 'sinon';
import uuid from 'uuidv4';
import validUpdateInitialState from '../../../shared/applications/valid/updateInitialState';

suite('AggregateApiForCommands', (): void => {
  let aggregate: Aggregate,
      application: Application,
      command: CommandInternal,
      eventstore: Eventstore,
      repository: Repository;

  setup(async (): Promise<void> => {
    aggregate = new Aggregate({
      contextIdentifier: { name: 'sampleContext' },
      aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
      initialState: {
        foo: 'bar'
      }
    });

    application = await Application.load({
      directory: path.join(__dirname, '..', '..', '..', 'shared', 'applications', 'base')
    });

    command = CommandInternal.create({
      contextIdentifier: { name: 'sampleContext' },
      aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
      name: 'handle',
      data: {
        strategy: 'succeed'
      },
      annotations: {
        client: { token: '...', user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}, ip: '127.0.0.1' },
        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
      }
    });

    eventstore = new Eventstore();

    await eventstore.create();

    repository = new Repository({ application, eventstore });
  });

  test('extends AggregateApiForReadOnly.', async (): Promise<void> => {
    const aggregateApiForCommands = new AggregateApiForCommands({
      aggregate, application, repository, command
    });

    assert.that(aggregateApiForCommands).is.instanceOf(AggregateApiForReadOnly);
  });

  suite('publishEvent', (): void => {
    test('pushes the event to the list of uncommitted events.', async (): Promise<void> => {
      const aggregateApiForCommands = new AggregateApiForCommands({
        aggregate, application, repository, command
      });

      aggregateApiForCommands.publishEvent('executed', {
        strategy: 'succeed'
      });

      assert.that(aggregate.uncommittedEvents.length).is.equalTo(1);
      assert.that(aggregate.uncommittedEvents[0]).is.atLeast({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate' },
        name: 'executed',
        data: {
          strategy: 'succeed'
        },
        metadata: {
          initiator: command.annotations.initiator,
          causationId: command.id,
          correlationId: command.id,
          revision: { aggregate: 1, global: null }
        }
      });
    });

    test('pushes multiple events to the list of uncommitted events.', async (): Promise<void> => {
      const aggregateApiForCommands = new AggregateApiForCommands({
        aggregate, application, repository, command
      });

      aggregateApiForCommands.publishEvent('succeeded');
      aggregateApiForCommands.publishEvent('executed', {
        strategy: 'succeed'
      });

      assert.that(aggregate.uncommittedEvents.length).is.equalTo(2);
      assert.that(aggregate.uncommittedEvents[0]).is.atLeast({
        name: 'succeeded',
        metadata: {
          revision: { aggregate: 1, global: null }
        }
      });
      assert.that(aggregate.uncommittedEvents[1]).is.atLeast({
        name: 'executed',
        metadata: {
          revision: { aggregate: 2, global: null }
        }
      });
    });

    test('attaches the previous and the new state to the event.', async (): Promise<void> => {
      const directory = await validUpdateInitialState();

      application = await Application.load({ directory });
      repository = new Repository({ application, eventstore });

      aggregate = new Aggregate({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
        initialState: {
          events: []
        }
      });

      const aggregateApiForCommands = new AggregateApiForCommands({
        aggregate, application, repository, command
      });

      aggregateApiForCommands.publishEvent('executed', {
        strategy: 'succeed'
      });

      assert.that(aggregate.uncommittedEvents.length).is.equalTo(1);
      assert.that(aggregate.uncommittedEvents[0].annotations).is.equalTo({
        previousState: {
          events: []
        },
        state: {
          events: [ 'executed' ]
        }
      });
    });

    test('calls event handle function with all services.', async (): Promise<void> => {
      const fake = sinon.fake();

      /* eslint-disable @typescript-eslint/unbound-method */
      application.events.internal.sampleContext!.sampleAggregate!.succeeded!.handle = fake;
      /* eslint-enable @typescript-eslint/unbound-method */

      const aggregateApiForCommands = new AggregateApiForCommands({
        aggregate, application, repository, command
      });

      aggregateApiForCommands.publishEvent('succeeded');

      assert.that(fake.called).is.true();
      assert.that(fake.callCount).is.equalTo(1);
      assert.that(fake.getCall(0).args.length).is.equalTo(3);
      assert.that(fake.getCall(0).args[2]).is.atLeast({
        app: {
          aggregates: {}
        },
        client: {},
        logger: {}
      });
    });

    test('throws an error if an unknown event name is given.', async (): Promise<void> => {
      const aggregateApiForCommands = new AggregateApiForCommands({
        aggregate, application, repository, command
      });

      assert.that((): void => {
        aggregateApiForCommands.publishEvent('non-existent');
      }).is.throwing(`Failed to publish unknown event 'non-existent' in 'sampleContext.sampleAggregate'.`);
    });

    test('throws an error if the schema of the event does not match.', async (): Promise<void> => {
      const aggregateApiForCommands = new AggregateApiForCommands({
        aggregate, application, repository, command
      });

      assert.that((): void => {
        aggregateApiForCommands.publishEvent('executed', {
          strategy: 'non-existent'
        });
      }).is.throwing(`No enum match (non-existent), expects: succeed, fail, reject (at data.strategy).`);
    });
  });
});
