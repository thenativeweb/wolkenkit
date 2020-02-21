import { AggregateService } from '../../../../lib/common/services/AggregateService';
import { ApplicationDefinition } from '../../../../lib/common/application/ApplicationDefinition';
import { assert } from 'assertthat';
import { cloneDeep } from 'lodash';
import { CommandWithMetadata } from '../../../../lib/common/elements/CommandWithMetadata';
import { CurrentAggregateState } from '../../../../lib/common/domain/CurrentAggregateState';
import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
import { getAggregateService } from '../../../../lib/common/services/getAggregateService';
import { getApplicationDefinition } from '../../../../lib/common/application/getApplicationDefinition';
import { getSnapshotStrategy } from '../../../../lib/common/domain/getSnapshotStrategy';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { InMemoryDomainEventStore } from '../../../../lib/stores/domainEventStore/InMemory';
import { Repository } from '../../../../lib/common/domain/Repository';
import { State } from '../../../../lib/common/elements/State';
import { uuid } from 'uuidv4';

suite('getAggregateService', (): void => {
  const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

  const contextName = 'sampleContext';
  const aggregateName = 'sampleAggregate';
  const commandName = 'execute';
  const domainEventName = 'executed';
  const commandId = uuid();
  const user = {
    id: 'jane.doe',
    claims: {
      sub: 'jane.doe'
    }
  };
  const command = new CommandWithMetadata({
    contextIdentifier: { name: contextName },
    aggregateIdentifier: { id: uuid(), name: aggregateName },
    name: commandName,
    data: {
      strategy: 'succeed'
    },
    id: commandId,
    metadata: {
      causationId: commandId,
      correlationId: uuid(),
      client: { ip: '127.0.0.0', token: 'some-token', user },
      initiator: { user },
      timestamp: Date.now()
    }
  });

  let aggregateService: AggregateService<State>,
      applicationDefinition: ApplicationDefinition,
      currentAggregateState: CurrentAggregateState<State>,
      domainEventHandlerCalled = false,
      domainEventStore: DomainEventStore,
      repository: Repository;

  suiteSetup(async (): Promise<void> => {
    applicationDefinition = await getApplicationDefinition({ applicationDirectory });
  });

  setup(async (): Promise<void> => {
    domainEventHandlerCalled = false;

    /* eslint-disable @typescript-eslint/unbound-method */
    const handleFunction = applicationDefinition.domain[contextName][aggregateName].domainEventHandlers[domainEventName].handle;

    /* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
    applicationDefinition.domain[contextName][aggregateName].domainEventHandlers[domainEventName].handle =
      function (state, domainEvent, services): Partial<State> {
        domainEventHandlerCalled = true;

        return handleFunction(state, domainEvent, services);
      };
    /* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
    /* eslint-enable @typescript-eslint/unbound-method */

    domainEventStore = await InMemoryDomainEventStore.create();

    repository = new Repository({
      applicationDefinition,
      domainEventStore,
      snapshotStrategy: getSnapshotStrategy({ name: 'never' })
    });

    currentAggregateState = await repository.loadCurrentAggregateState({
      contextIdentifier: {
        name: contextName
      },
      aggregateIdentifier: {
        name: aggregateName,
        id: uuid()
      }
    });

    aggregateService = getAggregateService<State>({ currentAggregateState, applicationDefinition, command });
  });

  suite('id', (): void => {
    test(`returns the aggregate's id.`, async (): Promise<void> => {
      assert.that(aggregateService.id()).is.equalTo(currentAggregateState.aggregateIdentifier.id);
    });
  });

  suite('exists', (): void => {
    test(`uses the aggregate's exists method.`, async (): Promise<void> => {
      let existsCalled = false;

      /* eslint-disable @typescript-eslint/unbound-method */
      currentAggregateState.exists = function (): boolean {
        existsCalled = true;

        return true;
      };
      /* eslint-enable @typescript-eslint/unbound-method */

      const doesExist = aggregateService.exists();

      assert.that(doesExist).is.true();
      assert.that(existsCalled).is.true();
    });
  });

  suite('publishDomainEvent', (): void => {
    test(`applies the given domain event to the aggregate and returns the new state.`, async (): Promise<void> => {
      const previousAggregateState = cloneDeep(currentAggregateState.state);
      const domainEventData = { strategy: 'succeed' };
      const nextState = aggregateService.publishDomainEvent(domainEventName, domainEventData);

      const generatedDomainEvent = currentAggregateState.unsavedDomainEvents[0];

      assert.that(generatedDomainEvent.data).is.equalTo(domainEventData);
      assert.that(generatedDomainEvent.metadata.causationId).is.equalTo(command.id);
      assert.that(generatedDomainEvent.metadata.correlationId).is.equalTo(command.metadata.correlationId);
      assert.that(generatedDomainEvent.metadata.initiator).is.equalTo(command.metadata.initiator);
      assert.that(generatedDomainEvent.metadata.revision.aggregate).is.equalTo(1);
      assert.that(generatedDomainEvent.metadata.revision.global).is.null();
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
