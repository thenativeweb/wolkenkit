import { buildCommandWithMetadata } from '../buildCommandWithMetadata';
import { buildDomainEvent } from '../buildDomainEvent';
import { Client } from '../../../elements/Client';
import { CommandData } from '../../../elements/CommandData';
import { createDomainEventStore } from '../../../../stores/domainEventStore/createDomainEventStore';
import { createLockStore } from '../../../../stores/lockStore/createLockStore';
import { DomainEvent } from '../../../elements/DomainEvent';
import { DomainEventData } from '../../../elements/DomainEventData';
import { DomainEventWithState } from '../../../elements/DomainEventWithState';
import { getAggregateService } from '../../../services/getAggregateService';
import { getAggregatesService } from '../../../services/getAggregatesService';
import { getClientService } from '../../../services/getClientService';
import { getLockService } from '../../../services/getLockService';
import { getLoggerService } from '../../../services/getLoggerService';
import { getSnapshotStrategy } from '../../../domain/getSnapshotStrategy';
import { Initiator } from '../../../elements/Initiator';
import { Repository } from '../../../domain/Repository';
import { SandboxConfigurationForAggregate } from './SandboxConfiguration';
import { State } from '../../../elements/State';
import { SandboxForAggregate, SandboxForAggregateWithResult } from './SandboxForAggregate';

const createSandboxForAggregate = function <TState extends State> (sandboxConfiguration: SandboxConfigurationForAggregate): SandboxForAggregate<TState> {
  return {
    given <TDomainEventData extends DomainEventData>({ name, data, id, metadata }: {
      name: string;
      data: TDomainEventData;
      id?: string;
      metadata?: {
        causationId?: string;
        correlationId?: string;
        timestamp?: number;
        initiator?: Initiator;
        tags?: string[];
      };
    }): SandboxForAggregate<TState> {
      return createSandboxForAggregate<TState>({
        ...sandboxConfiguration,
        domainEvents: [
          ...sandboxConfiguration.domainEvents,
          buildDomainEvent<TDomainEventData>({
            contextIdentifier: sandboxConfiguration.contextIdentifier,
            aggregateIdentifier: sandboxConfiguration.aggregateIdentifier,
            name,
            data,
            id,
            metadata: { ...metadata, revision: 0 }
          })
        ]
      });
    },

    and <TDomainEventData extends DomainEventData>({ name, data, id, metadata }: {
      name: string;
      data: TDomainEventData;
      id?: string;
      metadata?: {
        causationId?: string;
        correlationId?: string;
        timestamp?: number;
        initiator?: Initiator;
        tags?: string[];
      };
    }): SandboxForAggregate<TState> {
      return createSandboxForAggregate<TState>({
        ...sandboxConfiguration,
        domainEvents: [
          ...sandboxConfiguration.domainEvents,
          buildDomainEvent<TDomainEventData>({
            contextIdentifier: sandboxConfiguration.contextIdentifier,
            aggregateIdentifier: sandboxConfiguration.aggregateIdentifier,
            name,
            data,
            id,
            metadata: { ...metadata, revision: 0 }
          })
        ]
      });
    },

    when <TCommandData extends CommandData>({ name, data, id, metadata }: {
      name: string;
      data: TCommandData;
      id?: string;
      metadata?: {
        causationId?: string;
        correlationId?: string;
        timestamp?: number;
        client?: Client;
        initiator?: Initiator;
      };
    }): SandboxForAggregateWithResult<TState> {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return createSandboxForAggregateWithResult<TState>({
        ...sandboxConfiguration,
        commands: [
          ...sandboxConfiguration.commands,
          buildCommandWithMetadata<TCommandData>({
            contextIdentifier: sandboxConfiguration.contextIdentifier,
            aggregateIdentifier: sandboxConfiguration.aggregateIdentifier,
            name,
            data,
            id,
            metadata
          })
        ]
      });
    }
  };
};

const createSandboxForAggregateWithResult = function <TState extends State> (sandboxConfiguration: SandboxConfigurationForAggregate): SandboxForAggregateWithResult<TState> {
  return {
    and <TCommandData extends CommandData>({ name, data, id, metadata }: {
      name: string;
      data: TCommandData;
      id?: string;
      metadata?: {
        causationId?: string;
        correlationId?: string;
        timestamp?: number;
        client?: Client;
        initiator?: Initiator;
      };
    }): SandboxForAggregateWithResult<TState> {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return createSandboxForAggregateWithResult<TState>({
        ...sandboxConfiguration,
        commands: [
          ...sandboxConfiguration.commands,
          buildCommandWithMetadata<TCommandData>({
            contextIdentifier: sandboxConfiguration.contextIdentifier,
            aggregateIdentifier: sandboxConfiguration.aggregateIdentifier,
            name,
            data,
            id,
            metadata
          })
        ]
      });
    },

    async then (callback: ((parameters: {
      state: TState;
      domainEvents: DomainEvent<DomainEventData>[];
    }) => void | Promise<void>)): Promise<void> {
      const lockStore = sandboxConfiguration.lockStore ?? await createLockStore({ type: 'InMemory' });
      const domainEventStore = sandboxConfiguration.domainEventStore ?? await createDomainEventStore({ type: 'InMemory' });
      const snapshotStrategy = sandboxConfiguration.snapshotStrategy ?? getSnapshotStrategy({ name: 'never' });

      const aggregateServiceFactory = sandboxConfiguration.aggregateServiceFactory ?? getAggregateService;
      const aggregatesServiceFactory = sandboxConfiguration.aggregatesServiceFactory ?? getAggregatesService;
      const clientServiceFactory = sandboxConfiguration.clientServiceFactory ?? getClientService;
      const lockServiceFactory = sandboxConfiguration.lockServiceFactory ?? getLockService;
      const loggerServiceFactory = sandboxConfiguration.loggerServiceFactory ?? getLoggerService;

      const lastDomainEvent =
        await domainEventStore.getLastDomainEvent({ aggregateIdentifier: sandboxConfiguration.aggregateIdentifier });
      const nextRevision = (lastDomainEvent?.metadata.revision ?? 0) + 1;

      for (const [ index, domainEvent ] of sandboxConfiguration.domainEvents.entries()) {
        domainEvent.metadata.revision = nextRevision + index;
      }

      if (sandboxConfiguration.domainEvents.length > 0) {
        await domainEventStore.storeDomainEvents({ domainEvents: sandboxConfiguration.domainEvents });
      }

      const repository = new Repository({
        application: sandboxConfiguration.application,
        lockStore,
        domainEventStore,
        snapshotStrategy,
        serviceFactories: {
          getAggregateService: aggregateServiceFactory,
          getAggregatesService: aggregatesServiceFactory,
          getClientService: clientServiceFactory,
          getLockService: lockServiceFactory,
          getLoggerService: loggerServiceFactory
        }
      });

      const aggregateInstance = await repository.getAggregateInstance<TState>({
        contextIdentifier: sandboxConfiguration.contextIdentifier,
        aggregateIdentifier: sandboxConfiguration.aggregateIdentifier
      });

      let domainEventsWithState: DomainEventWithState<DomainEventData, TState>[] = [];

      for (const command of sandboxConfiguration.commands) {
        domainEventsWithState = await aggregateInstance.handleCommand({ command });
      }

      const domainEvents = domainEventsWithState.map(
        (domainEventWithState): DomainEvent<DomainEventData> => domainEventWithState.withoutState()
      );

      // eslint-disable-next-line callback-return
      await callback({ domainEvents, state: aggregateInstance.state });
    }
  };
};

export {
  createSandboxForAggregate
};
