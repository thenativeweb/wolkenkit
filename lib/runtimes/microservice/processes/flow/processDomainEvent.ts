import { acknowledgeDomainEvent } from './acknowledgeDomainEvent';
import { Application } from '../../../../common/application/Application';
import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { ConsumerProgressStore } from '../../../../stores/consumerProgressStore/ConsumerProgressStore';
import { DomainEventDispatcher } from './DomainEventDispatcher';
import { errors } from '../../../../common/errors';
import { executeFlow } from '../../../../common/domain/executeFlow';
import { fetchDomainEvent } from './fetchDomainEvent';
import { flaschenpost } from 'flaschenpost';
import { getAggregatesService } from '../../../../common/services/getAggregatesService';
import { getCommandService } from '../../../../common/services/getCommandService';
import { getDomainEventSchema } from '../../../../common/schemas/getDomainEventSchema';
import { getLockService } from '../../../../common/services/getLockService';
import { getLoggerService } from '../../../../common/services/getLoggerService';
import { keepRenewingLock } from './keepRenewingLock';
import { LockStore } from '../../../../stores/lockStore/LockStore';
import { Repository } from '../../../../common/domain/Repository';
import { Value } from 'validate-value';

const logger = flaschenpost.getLogger();

const processDomainEvent = async function ({
  application,
  domainEventDispatcher,
  consumerProgressStore,
  lockStore,
  repository,
  onIssueCommand
}: {
  application: Application;
  domainEventDispatcher: DomainEventDispatcher;
  consumerProgressStore: ConsumerProgressStore;
  lockStore: LockStore;
  repository: Repository;
  onIssueCommand: (parameters: { command: CommandWithMetadata<CommandData> }) => void | Promise<void>;
}): Promise<void> {
  const { domainEvent, metadata } = await fetchDomainEvent({ domainEventDispatcher });

  try {
    try {
      new Value(getDomainEventSchema()).validate(domainEvent, { valueName: 'domainEvent' });
    } catch (ex) {
      throw new errors.DomainEventMalformed(ex.message);
    }

    const flowName = metadata.discriminator;

    if (!(flowName in application.flows)) {
      throw new errors.FlowNotFound(`Received a domain event for unknown flow '${flowName}'.`);
    }

    const flowPromise = executeFlow({
      application,
      domainEvent,
      flowName,
      flowProgressStore: consumerProgressStore,
      services: {
        aggregates: getAggregatesService({ repository }),
        command: getCommandService({ domainEvent, onIssueCommand }),
        logger: getLoggerService({
          fileName: `<app>/server/flows/${flowName}`,
          packageManifest: application.packageManifest
        }),
        lock: getLockService({ lockStore }),
        infrastructure: application.infrastructure
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async (): Promise<void> => {
      await keepRenewingLock({ domainEvent, flowPromise, domainEventDispatcher, token: metadata.token });
    })();

    await flowPromise;
  } catch (ex) {
    logger.error('Failed to handle domain event.', { domainEvent, ex });
  } finally {
    await acknowledgeDomainEvent({ domainEvent, token: metadata.token, domainEventDispatcher });
  }
};

export { processDomainEvent };
