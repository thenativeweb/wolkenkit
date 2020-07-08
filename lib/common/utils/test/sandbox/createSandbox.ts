import { AggregateIdentifier } from '../../../elements/AggregateIdentifier';
import { Application } from '../../../application/Application';
import { ConsumerProgressStore } from '../../../../stores/consumerProgressStore/ConsumerProgressStore';
import { ContextIdentifier } from '../../../elements/ContextIdentifier';
import { createSandboxForAggregate } from './createSandboxForAggregate';
import { createSandboxForFlow } from './createSandboxForFlow';
import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { GetAggregateService } from '../../../services/types/GetAggregateService';
import { GetAggregatesService } from '../../../services/types/GetAggregatesService';
import { GetClientService } from '../../../services/types/GetClientService';
import { GetCommandService } from '../../../services/types/GetCommandService';
import { GetLockService } from '../../../services/types/GetLockService';
import { GetLoggerService } from '../../../services/types/GetLoggerService';
import { LockStore } from '../../../../stores/lockStore/LockStore';
import { SandboxConfiguration } from './SandboxConfiguration';
import { SandboxForAggregate } from './SandboxForAggregate';
import { SandboxForFlow } from './SandboxForFlow';
import { SnapshotStrategy } from '../../../domain/SnapshotStrategy';
import { State } from '../../../elements/State';
import { Sandbox, UninitializedSandbox } from './Sandbox';

const createSandbox = function (): UninitializedSandbox {
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

    forAggregate<TState extends State>({ contextIdentifier, aggregateIdentifier }: {
      contextIdentifier: ContextIdentifier;
      aggregateIdentifier: AggregateIdentifier;
    }): SandboxForAggregate<TState> {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return createSandboxForAggregate<TState>({
        ...sandboxConfiguration,
        contextIdentifier,
        aggregateIdentifier,
        domainEvents: [],
        commands: []
      });
    },

    forFlow ({ flowName }: {
      flowName: string;
    }): SandboxForFlow {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return createSandboxForFlow({
        ...sandboxConfiguration,
        flowName,
        domainEvents: []
      });
    }
  };
};

export { createSandbox };
