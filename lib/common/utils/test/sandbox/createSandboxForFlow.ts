import { buildDomainEvent } from '../buildDomainEvent';
import { CommandData } from '../../../elements/CommandData';
import { CommandWithMetadata } from '../../../elements/CommandWithMetadata';
import { createConsumerProgressStore } from '../../../../stores/consumerProgressStore/createConsumerProgressStore';
import { createDomainEventStore } from '../../../../stores/domainEventStore/createDomainEventStore';
import { createLockStore } from '../../../../stores/lockStore/createLockStore';
import { DomainEventData } from '../../../elements/DomainEventData';
import { executeFlow } from '../../../domain/executeFlow';
import { getAggregateService } from '../../../services/getAggregateService';
import { getAggregatesService } from '../../../services/getAggregatesService';
import { getClientService } from '../../../services/getClientService';
import { getCommandService } from '../../../services/getCommandService';
import { getLockService } from '../../../services/getLockService';
import { getLoggerService } from '../../../services/getLoggerService';
import { getSnapshotStrategy } from '../../../domain/getSnapshotStrategy';
import { Initiator } from '../../../elements/Initiator';
import { noop } from 'lodash';
import { Repository } from '../../../domain/Repository';
import { SandboxConfigurationForFlow } from './SandboxConfiguration';
import { SandboxForFlow, SandboxForFlowWithResult } from './SandboxForFlow';

const createSandboxForFlow = function (sandboxConfiguration: SandboxConfigurationForFlow): SandboxForFlow {
  return {
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
    }): SandboxForFlowWithResult {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return createSandboxForFlowWithResult({
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

const createSandboxForFlowWithResult = function (sandboxConfiguration: SandboxConfigurationForFlow): SandboxForFlowWithResult {
  return {
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
    }): SandboxForFlowWithResult {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return createSandboxForFlowWithResult({
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

    async then (callback: (parameters: {
      commands: CommandWithMetadata<CommandData>[];
    }) => (void | Promise<void>)): Promise<void> {
      const lockStore = sandboxConfiguration.lockStore ?? await createLockStore({ type: 'InMemory' });
      const domainEventStore = sandboxConfiguration.domainEventStore ?? await createDomainEventStore({ type: 'InMemory' });
      const flowProgressStore = sandboxConfiguration.flowProgressStore ?? await createConsumerProgressStore({ type: 'InMemory' });
      const snapshotStrategy = sandboxConfiguration.snapshotStrategy ?? getSnapshotStrategy({ name: 'never' });

      const aggregateServiceFactory = sandboxConfiguration.aggregateServiceFactory ?? getAggregateService;
      const aggregatesServiceFactory = sandboxConfiguration.aggregatesServiceFactory ?? getAggregatesService;
      const clientServiceFactory = sandboxConfiguration.clientServiceFactory ?? getClientService;
      const commandServiceFactory = sandboxConfiguration.commandServiceFactory ?? getCommandService;
      const lockServiceFactory = sandboxConfiguration.lockServiceFactory ?? getLockService;
      const loggerServiceFactory = sandboxConfiguration.loggerServiceFactory ?? getLoggerService;

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

      for (const domainEvent of sandboxConfiguration.domainEvents) {
        await executeFlow({
          application: sandboxConfiguration.application,
          domainEvent,
          flowName: sandboxConfiguration.flowName,
          flowProgressStore,
          requestReplay: noop,
          services: {
            aggregates: aggregatesServiceFactory({ repository }),
            command: commandServiceFactory({ domainEvent, issueCommand }),
            infrastructure: sandboxConfiguration.application.infrastructure,
            logger: loggerServiceFactory({
              packageManifest: sandboxConfiguration.application.packageManifest,
              fileName: `<app>/server/flows/${sandboxConfiguration.flowName}`
            }),
            lock: lockServiceFactory({ lockStore })
          }
        });
      }

      // eslint-disable-next-line callback-return
      await callback({ commands: issuedCommands });
    }
  };
};

export { createSandboxForFlow };
