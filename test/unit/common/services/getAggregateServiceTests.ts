import { AggregateInstance } from '../../../../lib/common/domain/AggregateInstance';
import { AggregateService } from '../../../../lib/common/services/AggregateService';
import { Application } from '../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { cloneDeep } from 'lodash';
import { CommandWithMetadata } from '../../../../lib/common/elements/CommandWithMetadata';
import { createLockStore } from '../../../../lib/stores/lockStore/createLockStore';
import { createPublisher } from '../../../../lib/messaging/pubSub/createPublisher';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { getAggregateService } from '../../../../lib/common/services/getAggregateService';
import { getSnapshotStrategy } from '../../../../lib/common/domain/getSnapshotStrategy';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { InMemoryDomainEventStore } from '../../../../lib/stores/domainEventStore/InMemory';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { LockStore } from '../../../../lib/stores/lockStore/LockStore';
import { Notification } from '../../../../lib/common/elements/Notification';
import { Publisher } from '../../../../lib/messaging/pubSub/Publisher';
import { Repository } from '../../../../lib/common/domain/Repository';
import { State } from '../../../../lib/common/elements/State';
import { v4 } from 'uuid';

suite('getAggregateService', (): void => {
  const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

  const contextName = 'sampleContext';
  const aggregateName = 'sampleAggregate';
  const commandName = 'execute';
  const domainEventName = 'executed';
  const commandId = v4();
  const user = {
    id: 'jane.doe',
    claims: {
      sub: 'jane.doe'
    }
  };
  const command = new CommandWithMetadata({
    contextIdentifier: { name: contextName },
    aggregateIdentifier: { id: v4(), name: aggregateName },
    name: commandName,
    data: {
      strategy: 'succeed'
    },
    id: commandId,
    metadata: {
      causationId: commandId,
      correlationId: v4(),
      client: { ip: '127.0.0.0', token: 'some-token', user },
      initiator: { user },
      timestamp: Date.now()
    }
  });

  let aggregateInstance: AggregateInstance<State>,
      aggregateService: AggregateService<State>,
      application: Application,
      domainEventHandlerCalled = false,
      domainEventStore: DomainEventStore,
      lockStore: LockStore,
      publisher: Publisher<Notification>,
      publisherChannelForNotifications: string,
      repository: Repository;

  suiteSetup(async (): Promise<void> => {
    application = await loadApplication({ applicationDirectory });
  });

  setup(async (): Promise<void> => {
    domainEventHandlerCalled = false;

    /* eslint-disable @typescript-eslint/unbound-method */
    const handleFunction = application.domain[contextName][aggregateName].domainEventHandlers[domainEventName].handle;

    /* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
    application.domain[contextName][aggregateName].domainEventHandlers[domainEventName].handle =
      function (state, domainEvent, services): Partial<State> {
        domainEventHandlerCalled = true;

        return handleFunction(state, domainEvent, services);
      };
    /* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
    /* eslint-enable @typescript-eslint/unbound-method */

    domainEventStore = await InMemoryDomainEventStore.create({ type: 'InMemory' });
    lockStore = await createLockStore({ type: 'InMemory' });
    publisher = await createPublisher<Notification>({ type: 'InMemory' });
    publisherChannelForNotifications = 'notifications';

    repository = new Repository({
      application,
      lockStore,
      domainEventStore,
      snapshotStrategy: getSnapshotStrategy({ name: 'never' }),
      publisher,
      publisherChannelForNotifications
    });

    aggregateInstance = await repository.getAggregateInstance({
      contextIdentifier: {
        name: contextName
      },
      aggregateIdentifier: {
        name: aggregateName,
        id: v4()
      }
    });

    aggregateService = getAggregateService<State>({ aggregateInstance, application, command });
  });

  suite('id', (): void => {
    test(`returns the aggregate's id.`, async (): Promise<void> => {
      assert.that(aggregateService.id()).is.equalTo(aggregateInstance.aggregateIdentifier.id);
    });
  });

  suite('isPristine', (): void => {
    test(`uses the aggregate's isPristine method.`, async (): Promise<void> => {
      let isPristineCalled = false;

      /* eslint-disable @typescript-eslint/unbound-method */
      aggregateInstance.isPristine = function (): boolean {
        isPristineCalled = true;

        return true;
      };
      /* eslint-enable @typescript-eslint/unbound-method */

      const isPristine = aggregateService.isPristine();

      assert.that(isPristine).is.true();
      assert.that(isPristineCalled).is.true();
    });
  });

  suite('publishDomainEvent', (): void => {
    test(`applies the given domain event to the aggregate and returns the new state.`, async (): Promise<void> => {
      const previousAggregateState = cloneDeep(aggregateInstance.state);
      const domainEventData = { strategy: 'succeed' };
      const nextState = aggregateService.publishDomainEvent(domainEventName, domainEventData);

      const generatedDomainEvent = aggregateInstance.unstoredDomainEvents[0];

      assert.that(generatedDomainEvent.data).is.equalTo(domainEventData);
      assert.that(generatedDomainEvent.metadata.causationId).is.equalTo(command.id);
      assert.that(generatedDomainEvent.metadata.correlationId).is.equalTo(command.metadata.correlationId);
      assert.that(generatedDomainEvent.metadata.initiator).is.equalTo(command.metadata.initiator);
      assert.that(generatedDomainEvent.metadata.revision).is.equalTo(1);
      assert.that(generatedDomainEvent.data).is.equalTo(domainEventData);
      assert.that(generatedDomainEvent.state.previous).is.equalTo(previousAggregateState);
      assert.that(generatedDomainEvent.state.next).is.equalTo(nextState);
      assert.that(domainEventHandlerCalled).is.true();
    });

    test('throws an error if the published domain event is unknown.', async (): Promise<void> => {
      const unknownDomainEventName = 'someUnknownDomainEvent';

      assert.that((): void => {
        aggregateService.publishDomainEvent(unknownDomainEventName, {});
      }).is.throwing(`Failed to publish unknown domain event '${unknownDomainEventName}' in '${contextName}.${aggregateName}'.`);
    });

    test(`throws an error if the published domain event's data does not match its schema.`, async (): Promise<void> => {
      assert.that((): void => {
        aggregateService.publishDomainEvent(domainEventName, { foo: 'bar' });
      }).is.throwing('Missing required property: strategy (at data.strategy).');
    });
  });
});
