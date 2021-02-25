import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { Client as DomainEventDispatcherClient } from '../../../../apis/handleDomainEvent/http/v2/Client';
import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { PerformReplay } from '../../../../common/domain/PerformReplay';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';

const logger = flaschenpost.getLogger();

const getPerformReplay = function ({
  domainEventStore,
  domainEventDispatcherClient
}: {
  domainEventStore: DomainEventStore;
  domainEventDispatcherClient: DomainEventDispatcherClient;
}): PerformReplay {
  return async function ({ flowNames, aggregates }): Promise<void> {
    try {
      logger.debug(
        'Performing replay...',
        withLogMetadata('runtime', 'microservice/replay', { flowNames, aggregates })
      );

      for (const aggregate of aggregates) {
        const domainEventStream = await domainEventStore.getReplayForAggregate({
          aggregateId: aggregate.aggregateIdentifier.aggregate.id,
          fromRevision: aggregate.from,
          toRevision: aggregate.to
        });

        for await (const rawDomainEvent of domainEventStream) {
          const domainEvent = new DomainEvent<DomainEventData>(rawDomainEvent);

          await domainEventDispatcherClient.postDomainEvent({ flowNames, domainEvent });
        }
      }

      logger.debug(
        'Replay performed.',
        withLogMetadata('runtime', 'microservice/replay', { flowNames, aggregates })
      );
    } catch (ex: unknown) {
      logger.error(
        'Failed to perform replay.',
        withLogMetadata('runtime', 'microservice/replay', { flowNames, aggregates, error: ex })
      );

      throw new errors.ReplayFailed('Failed to perform replay.', {
        cause: ex as Error,
        data: { flowNames, aggregates }
      });
    }
  };
};

export { getPerformReplay };
