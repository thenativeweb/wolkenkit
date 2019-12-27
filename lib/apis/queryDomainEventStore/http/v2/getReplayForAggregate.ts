import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { isUuid } from 'uuidv4';
import { parseGetReplayForAggregateQueryParameters } from './parameters/parseGetReplayForAggregateQueryParameters';
import { RequestHandler } from 'express-serve-static-core';
import { streamNdjsonMiddleware } from '../../../middlewares/streamNdjson';
import { Subscriber } from '../../../../messaging/pubSub/Subscriber';
import { writeLine } from '../../../base/writeLine';

const getReplayForAggregate = function ({
  domainEventStore,
  newDomainEventSubscriber,
  newDomainEventSubscriberChannel,
  heartbeatInterval
}: {
  domainEventStore: DomainEventStore;
  newDomainEventSubscriber: Subscriber<DomainEvent<DomainEventData>>;
  newDomainEventSubscriberChannel: string;
  heartbeatInterval: number;
}): RequestHandler {
  return async function (req, res): Promise<any> {
    let fromRevision: number | undefined,
        toRevision: number | undefined;
    let observe: boolean;

    try {
      ({ fromRevision, toRevision, observe } = parseGetReplayForAggregateQueryParameters({ parameters: req.query }));
    } catch (ex) {
      return res.status(400).send(ex.message);
    }

    const { aggregateId } = req.params;

    if (!isUuid(aggregateId)) {
      return res.status(400).end('Aggregate id must be a uuid.');
    }

    const heartbeatMiddleware = streamNdjsonMiddleware({ heartbeatInterval });

    await heartbeatMiddleware(req, res, (): void => {
      // No need for a `next`-callback for this middleware.
    });

    const domainEventStream = await domainEventStore.getReplayForAggregate({ aggregateId, fromRevision, toRevision });

    for await (const domainEvent of domainEventStream) {
      writeLine({ res, data: domainEvent });
    }

    if (!observe) {
      return res.end();
    }

    const publishDomainEvent = async function (domainEvent: DomainEvent<DomainEventData>): Promise<void> {
      if (domainEvent.aggregateIdentifier.id !== aggregateId) {
        return;
      }

      if (fromRevision && domainEvent.metadata.revision.global! < fromRevision) {
        return;
      }

      if (toRevision && domainEvent.metadata.revision.global! > toRevision) {
        await newDomainEventSubscriber.unsubscribe({
          channel: newDomainEventSubscriberChannel,
          callback: publishDomainEvent
        });

        res.end();

        return;
      }

      writeLine({ res, data: domainEvent });
    };

    await newDomainEventSubscriber.subscribe({
      channel: newDomainEventSubscriberChannel,
      callback: publishDomainEvent
    });
  };
};

export { getReplayForAggregate };
