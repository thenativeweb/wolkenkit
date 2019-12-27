import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { parseGetReplayQueryParameters } from './parameters/parseGetReplayQueryParameters';
import { RequestHandler } from 'express-serve-static-core';
import { streamNdjsonMiddleware } from '../../../middlewares/streamNdjson';
import { Subscriber } from '../../../../messaging/pubSub/Subscriber';
import { writeLine } from '../../../base/writeLine';

const getReplay = function ({
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
    let fromRevisionGlobal: number | undefined,
        toRevisionGlobal: number | undefined;
    let observe: boolean;

    try {
      ({ fromRevisionGlobal, toRevisionGlobal, observe } = parseGetReplayQueryParameters({ parameters: req.query }));
    } catch (ex) {
      return res.status(400).send(ex.message);
    }

    const heartbeatMiddleware = streamNdjsonMiddleware({ heartbeatInterval });

    await heartbeatMiddleware(req, res, (): void => {
      // No need for a `next`-callback for this middleware.
    });

    const domainEventStream = await domainEventStore.getReplay({ fromRevisionGlobal, toRevisionGlobal });

    for await (const domainEvent of domainEventStream) {
      writeLine({ res, data: domainEvent });
    }

    if (!observe) {
      return res.end();
    }

    const publishDomainEvent = async function (domainEvent: DomainEvent<DomainEventData>): Promise<void> {
      if (fromRevisionGlobal && domainEvent.metadata.revision.global! < fromRevisionGlobal) {
        return;
      }

      if (toRevisionGlobal && domainEvent.metadata.revision.global! > toRevisionGlobal) {
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

export { getReplay };
