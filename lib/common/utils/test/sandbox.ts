import { AggregateIdentifier } from '../../elements/AggregateIdentifier';
import { Application } from '../../application/Application';
import { buildCommandWithMetadata } from './buildCommandWithMetadata';
import { buildDomainEvent } from './buildDomainEvent';
import { Client } from '../../elements/Client';
import { CommandData } from '../../elements/CommandData';
import { CommandWithMetadata } from '../../elements/CommandWithMetadata';
import { ContextIdentifier } from '../../elements/ContextIdentifier';
import { createDomainEventStore } from '../../../stores/domainEventStore/createDomainEventStore';
import { createLockStore } from '../../../stores/lockStore/createLockStore';
import { DomainEvent } from '../../elements/DomainEvent';
import { DomainEventData } from '../../elements/DomainEventData';
import { DomainEventStore } from '../../../stores/domainEventStore/DomainEventStore';
import { DomainEventWithState } from '../../elements/DomainEventWithState';
import { getAggregateService } from '../../services/getAggregateService';
import { GetAggregateService } from '../../services/types/GetAggregateService';
import { getAggregatesService } from '../../services/getAggregatesService';
import { GetAggregatesService } from '../../services/types/GetAggregatesService';
import { getClientService } from '../../services/getClientService';
import { GetClientService } from '../../services/types/GetClientService';
import { getLockService } from '../../services/getLockService';
import { GetLockService } from '../../services/types/GetLockService';
import { getLoggerService } from '../../services/getLoggerService';
import { GetLoggerService } from '../../services/types/GetLoggerService';
import { getSnapshotStrategy } from '../../domain/getSnapshotStrategy';
import { Initiator } from '../../elements/Initiator';
import { LockStore } from '../../../stores/lockStore/LockStore';
import { Repository } from '../../domain/Repository';
import { SnapshotStrategy } from '../../domain/SnapshotStrategy';
import { State } from '../../elements/State';

interface UninitializedSandbox {
  withApplication({ application }: {
    application: Application;
  }): Sandbox;
}

interface Sandbox {
  withDomainEventStore({ domainEventStore }: {
    domainEventStore: DomainEventStore;
  }): Sandbox;

  withLockStore({ lockStore }: {
    lockStore: LockStore;
  }): Sandbox;

  withSnapshotStrategy({ snapshotStrategy }: {
    snapshotStrategy: SnapshotStrategy;
  }): Sandbox;

  withAggregateServiceFactory({ aggregateServiceFactory }: {
    aggregateServiceFactory: GetAggregateService;
  }): Sandbox;

  withAggregatesServiceFactory({ aggregatesServiceFactory }: {
    aggregatesServiceFactory: GetAggregatesService;
  }): Sandbox;

  withClientServiceFactory({ clientServiceFactory }: {
    clientServiceFactory: GetClientService;
  }): Sandbox;

  withLockServiceFactory({ lockServiceFactory }: {
    lockServiceFactory: GetLockService;
  }): Sandbox;

  withLoggerServiceFactory({ loggerServiceFactory }: {
    loggerServiceFactory: GetLoggerService;
  }): Sandbox;

  forAggregate<TState extends State>({ contextIdentifier, aggregateIdentifier }: {
    contextIdentifier: ContextIdentifier;
    aggregateIdentifier: AggregateIdentifier;
  }): SandboxForAggregate<TState>;
}

interface SandboxForAggregate<TState extends State> {
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
  }): SandboxForAggregate<TState>;

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
  }): SandboxForAggregate<TState>;

  when<TCommandData extends CommandData>({ name, data, id, metadata }: {
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
  }): SandboxWithResult<TState>;
}

interface SandboxWithResult<TState extends State> {
  and<TCommandData extends CommandData>({ name, data, id, metadata }: {
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
  }): SandboxWithResult<TState>;

  then(callback: ((parameters: {
    state: State;
    domainEvents: DomainEvent<DomainEventData>[];
  }) => void | Promise<void>)): Promise<void>;
}

interface SandboxConfiguration {
  application: Application;

  domainEventStore?: DomainEventStore;
  lockStore?: LockStore;
  snapshotStrategy?: SnapshotStrategy;

  aggregateServiceFactory?: GetAggregateService;
  aggregatesServiceFactory?: GetAggregatesService;
  clientServiceFactory?: GetClientService;
  lockServiceFactory?: GetLockService;
  loggerServiceFactory?: GetLoggerService;
}

interface SandboxConfigurationWithAggregate extends SandboxConfiguration {
  contextIdentifier: ContextIdentifier;
  aggregateIdentifier: AggregateIdentifier;

  domainEvents: DomainEvent<DomainEventData>[];
  commands: CommandWithMetadata<CommandData>[];
}

const sandbox = function (): UninitializedSandbox {
  return {
    withApplication ({ application }: {
      application: Application;
    }): Sandbox {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return initializedSandbox({
        application
      });
    }
  };
};

const initializedSandbox = function (sandboxConfiguration: SandboxConfiguration): Sandbox {
  return {
    withDomainEventStore ({ domainEventStore }: {
      domainEventStore: DomainEventStore;
    }): Sandbox {
      return initializedSandbox({
        ...sandboxConfiguration,
        domainEventStore
      });
    },

    withLockStore ({ lockStore }: {
      lockStore: LockStore;
    }): Sandbox {
      return initializedSandbox({
        ...sandboxConfiguration,
        lockStore
      });
    },

    withSnapshotStrategy ({ snapshotStrategy }: {
      snapshotStrategy: SnapshotStrategy;
    }): Sandbox {
      return initializedSandbox({
        ...sandboxConfiguration,
        snapshotStrategy
      });
    },

    withAggregateServiceFactory ({ aggregateServiceFactory }: {
      aggregateServiceFactory: GetAggregateService;
    }): Sandbox {
      return initializedSandbox({
        ...sandboxConfiguration,
        aggregateServiceFactory
      });
    },

    withAggregatesServiceFactory ({ aggregatesServiceFactory }: {
      aggregatesServiceFactory: GetAggregatesService;
    }): Sandbox {
      return initializedSandbox({
        ...sandboxConfiguration,
        aggregatesServiceFactory
      });
    },

    withClientServiceFactory ({ clientServiceFactory }: {
      clientServiceFactory: GetClientService;
    }): Sandbox {
      return initializedSandbox({
        ...sandboxConfiguration,
        clientServiceFactory
      });
    },

    withLockServiceFactory ({ lockServiceFactory }: {
      lockServiceFactory: GetLockService;
    }): Sandbox {
      return initializedSandbox({
        ...sandboxConfiguration,
        lockServiceFactory
      });
    },

    withLoggerServiceFactory ({ loggerServiceFactory }: {
      loggerServiceFactory: GetLoggerService;
    }): Sandbox {
      return initializedSandbox({
        ...sandboxConfiguration,
        loggerServiceFactory
      });
    },

    forAggregate<TState extends State>({ contextIdentifier, aggregateIdentifier }: {
      contextIdentifier: ContextIdentifier;
      aggregateIdentifier: AggregateIdentifier;
    }): SandboxForAggregate<TState> {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return sandboxForAggregate<TState>({
        ...sandboxConfiguration,
        contextIdentifier,
        aggregateIdentifier,
        domainEvents: [],
        commands: []
      });
    }
  };
};

const sandboxForAggregate = function <TState extends State> (sandboxConfiguration: SandboxConfigurationWithAggregate): SandboxForAggregate<TState> {
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
      return sandboxForAggregate<TState>({
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
      return sandboxForAggregate<TState>({
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
    }): SandboxWithResult<TState> {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return sandboxWithResult<TState>({
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

const sandboxWithResult = function <TState extends State> (sandboxConfiguration: SandboxConfigurationWithAggregate): SandboxWithResult<TState> {
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
    }): SandboxWithResult<TState> {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return sandboxWithResult<TState>({
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
      const lockStore = sandboxConfiguration.lockStore ?? await createLockStore({ type: 'InMemory', options: {}});
      const domainEventStore = sandboxConfiguration.domainEventStore ?? await createDomainEventStore({ type: 'InMemory', options: {}});
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

export { sandbox };
