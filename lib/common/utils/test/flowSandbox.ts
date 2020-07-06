import { Application } from '../../application/Application';
import { buildDomainEvent } from './buildDomainEvent';
import { Command } from '../../elements/Command';
import { CommandData } from '../../elements/CommandData';
import { CommandWithMetadata } from '../../elements/CommandWithMetadata';
import { ConsumerProgressStore } from '../../../stores/consumerProgressStore/ConsumerProgressStore';
import { createConsumerProgressStore } from '../../../stores/consumerProgressStore/createConsumerProgressStore';
import { createDomainEventStore } from '../../../stores/domainEventStore/createDomainEventStore';
import { createLockStore } from '../../../stores/lockStore/createLockStore';
import { DomainEvent } from '../../elements/DomainEvent';
import { DomainEventData } from '../../elements/DomainEventData';
import { DomainEventStore } from '../../../stores/domainEventStore/DomainEventStore';
import { executeFlow } from '../../domain/executeFlow';
import { getAggregateService } from '../../services/getAggregateService';
import { GetAggregateService } from '../../services/types/GetAggregateService';
import { getAggregatesService } from '../../services/getAggregatesService';
import { GetAggregatesService } from '../../services/types/GetAggregatesService';
import { GetClientService } from '../../services/types/GetClientService';
import { getClientService } from '../../services/getClientService';
import { GetCommandService } from '../../services/types/GetCommandService';
import { getCommandService } from '../../services/getCommandService';
import { getLockService } from '../../services/getLockService';
import { GetLockService } from '../../services/types/GetLockService';
import { getLoggerService } from '../../services/getLoggerService';
import { GetLoggerService } from '../../services/types/GetLoggerService';
import { getSnapshotStrategy } from '../../domain/getSnapshotStrategy';
import { Initiator } from '../../elements/Initiator';
import { LockStore } from '../../../stores/lockStore/LockStore';
import { noop } from 'lodash';
import { Repository } from '../../domain/Repository';
import { SnapshotStrategy } from '../../domain/SnapshotStrategy';

interface UnititializedSandbox {
  withApplication(parameters: {
    application: Application;
  }): Sandbox;
}

interface Sandbox {
  withDomainEventStore(parameters: {
    domainEventStore: DomainEventStore;
  }): Sandbox;

  withFlowProgressStore(parameters: {
    flowProgressStore: ConsumerProgressStore;
  }): Sandbox;

  withLockStore(parameters: {
    lockStore: LockStore;
  }): Sandbox;

  withSnapshotStrategy(parameters: {
    snapshotStrategy: SnapshotStrategy;
  }): Sandbox;

  withAggregateServiceFactory({ aggregateServiceFactory }: {
    aggregateServiceFactory: GetAggregateService;
  }): Sandbox;

  withAggregatesServiceFactory(parameters: {
    aggregatesServiceFactory: GetAggregatesService;
  }): Sandbox;

  withClientServiceFactory({ clientServiceFactory }: {
    clientServiceFactory: GetClientService;
  }): Sandbox;

  withCommandServiceFactory(parameters: {
    commandServiceFactory: GetCommandService;
  }): Sandbox;

  withLockServiceFactory(parameters: {
    lockServiceFactory: GetLockService;
  }): Sandbox;

  withLoggerServiceFactory(parameters: {
    loggerServiceFactory: GetLoggerService;
  }): Sandbox;

  forFlow(parameters: {
    flowName: string;
  }): SandboxForFlow;
}

interface SandboxForFlow {
  given <TDomainEventData extends DomainEventData>(parameters: {
    contextIdentifier: { name: string };
    aggregateIdentifier: { name: string; id: string };
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
  }): SandboxForFlow;

  and <TDomainEventData extends DomainEventData>(parameters: {
    contextIdentifier: { name: string };
    aggregateIdentifier: { name: string; id: string };
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
  }): SandboxForFlow;

  when <TDomainEventData extends DomainEventData>(parameters: {
    contextIdentifier: { name: string };
    aggregateIdentifier: { name: string; id: string };
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
  }): SandboxWithResult;
}

interface SandboxWithResult {
  then(callback: ((parameters: {
    commands: Command<CommandData>[];
  }) => void | Promise<void>)): Promise<void>;
}

interface SandboxConfiguration {
  application: Application;

  domainEventStore?: DomainEventStore;
  flowProgressStore?: ConsumerProgressStore;
  lockStore?: LockStore;
  snapshotStrategy?: SnapshotStrategy;

  aggregateServiceFactory?: GetAggregateService;
  aggregatesServiceFactory?: GetAggregatesService;
  clientServiceFactory?: GetClientService;
  commandServiceFactory?: GetCommandService;
  lockServiceFactory?: GetLockService;
  loggerServiceFactory?: GetLoggerService;
}

interface SandboxConfigurationWithFlow extends SandboxConfiguration {
  flowName: string;

  domainEvents: DomainEvent<DomainEventData>[];
}

const sandbox = function (): UnititializedSandbox {
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

    withFlowProgressStore ({ flowProgressStore }: {
      flowProgressStore: ConsumerProgressStore;
    }): Sandbox {
      return initializedSandbox({
        ...sandboxConfiguration,
        flowProgressStore
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

    withCommandServiceFactory ({ commandServiceFactory }: {
      commandServiceFactory: GetCommandService;
    }): Sandbox {
      return initializedSandbox({
        ...sandboxConfiguration,
        commandServiceFactory
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

    forFlow ({ flowName }: {
      flowName: string;
    }): SandboxForFlow {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return sandboxForFlow({
        ...sandboxConfiguration,
        flowName,
        domainEvents: []
      });
    }
  };
};

const sandboxForFlow = function (sandboxConfiguration: SandboxConfigurationWithFlow): SandboxForFlow {
  return {
    given <TDomainEventData extends DomainEventData>({
      contextIdentifier,
      aggregateIdentifier,
      name,
      data,
      id,
      metadata
    }: {
      contextIdentifier: { name: string };
      aggregateIdentifier: { name: string; id: string };
      name: string;
      data: TDomainEventData;
      id?: string;
      metadata: {
        causationId?: string;
        correlationId?: string;
        timestamp?: number;
        initiator?: Initiator;
        tags?: string[];
        revision: number;
      };
    }): SandboxForFlow {
      return sandboxForFlow({
        ...sandboxConfiguration,
        domainEvents: [
          ...sandboxConfiguration.domainEvents,
          buildDomainEvent<TDomainEventData>({
            contextIdentifier,
            aggregateIdentifier,
            name,
            data,
            id,
            metadata: { ...metadata, revision: metadata.revision }
          })
        ]
      });
    },

    and <TDomainEventData extends DomainEventData>({
      contextIdentifier,
      aggregateIdentifier,
      name,
      data,
      id,
      metadata
    }: {
      contextIdentifier: { name: string };
      aggregateIdentifier: { name: string; id: string };
      name: string;
      data: TDomainEventData;
      id?: string;
      metadata: {
        causationId?: string;
        correlationId?: string;
        timestamp?: number;
        initiator?: Initiator;
        tags?: string[];
        revision: number;
      };
    }): SandboxForFlow {
      return sandboxForFlow({
        ...sandboxConfiguration,
        domainEvents: [
          ...sandboxConfiguration.domainEvents,
          buildDomainEvent<TDomainEventData>({
            contextIdentifier,
            aggregateIdentifier,
            name,
            data,
            id,
            metadata: { ...metadata, revision: metadata.revision }
          })
        ]
      });
    },

    when <TDomainEventData extends DomainEventData>({
      contextIdentifier,
      aggregateIdentifier,
      name,
      data,
      id,
      metadata
    }: {
      contextIdentifier: { name: string };
      aggregateIdentifier: { name: string; id: string };
      name: string;
      data: TDomainEventData;
      id?: string;
      metadata: {
        causationId?: string;
        correlationId?: string;
        timestamp?: number;
        initiator?: Initiator;
        tags?: string[];
        revision: number;
      };
    }): SandboxWithResult {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return sandboxWithResult({
        ...sandboxConfiguration,
        domainEvents: [
          ...sandboxConfiguration.domainEvents,
          buildDomainEvent<TDomainEventData>({
            contextIdentifier,
            aggregateIdentifier,
            name,
            data,
            id,
            metadata: { ...metadata, revision: metadata.revision }
          })
        ]
      });
    }
  };
};

const sandboxWithResult = function (sandboxConfiguration: SandboxConfigurationWithFlow): SandboxWithResult {
  return {
    async then (callback: (parameters: {
      commands: CommandWithMetadata<CommandData>[];
    }) => (void | Promise<void>)): Promise<void> {
      const lockStore = sandboxConfiguration.lockStore ?? await createLockStore({ type: 'InMemory', options: {}});
      const domainEventStore = sandboxConfiguration.domainEventStore ?? await createDomainEventStore({ type: 'InMemory', options: {}});
      const flowProgressStore = sandboxConfiguration.flowProgressStore ?? await createConsumerProgressStore({ type: 'InMemory', options: {}});
      const snapshotStrategy = sandboxConfiguration.snapshotStrategy ?? getSnapshotStrategy({ name: 'never' });

      const aggregateServiceFactory = sandboxConfiguration.aggregateServiceFactory ?? getAggregateService;
      const aggregatesServiceFactory = sandboxConfiguration.aggregatesServiceFactory ?? getAggregatesService;
      const clientServiceFactory = sandboxConfiguration.clientServiceFactory ?? getClientService;
      const commandServiceFactory = sandboxConfiguration.commandServiceFactory ?? getCommandService;
      const lockServiceFactory = sandboxConfiguration.lockServiceFactory ?? getLockService;
      const loggerServiceFactory = sandboxConfiguration.loggerServiceFactory ?? getLoggerService;

      if (sandboxConfiguration.domainEvents.length > 1) {
        await domainEventStore.storeDomainEvents({ domainEvents: sandboxConfiguration.domainEvents.slice(0, -1) });
      }

      const lastDomainEvent = sandboxConfiguration.domainEvents[sandboxConfiguration.domainEvents.length - 1];

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

      const issuedCommands: CommandWithMetadata<CommandData>[] = [];
      const issueCommand = async function ({ command }: { command: CommandWithMetadata<CommandData> }): Promise<void> {
        issuedCommands.push(command);
      };

      await executeFlow({
        application: sandboxConfiguration.application,
        domainEvent: lastDomainEvent,
        flowName: sandboxConfiguration.flowName,
        flowProgressStore,
        requestReplay: noop,
        services: {
          aggregates: aggregatesServiceFactory({ repository }),
          command: commandServiceFactory({ domainEvent: lastDomainEvent, issueCommand }),
          infrastructure: sandboxConfiguration.application.infrastructure,
          logger: loggerServiceFactory({
            packageManifest: sandboxConfiguration.application.packageManifest,
            fileName: `<app>/server/flows/${sandboxConfiguration.flowName}`
          }),
          lock: lockServiceFactory({ lockStore })
        }
      });

      // eslint-disable-next-line callback-return
      await callback({ commands: issuedCommands });
    }
  };
};

export { sandbox };
