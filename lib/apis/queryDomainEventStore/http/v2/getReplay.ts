import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { RequestHandler } from 'express-serve-static-core';
import { Subscriber } from '../../../../messaging/pubSub/Subscriber';
import { writeLine } from '../../../base/writeLine';

const getReplay = function ({
  domainEventStore,
  newDomainEventSubscriber,
  newDomainEventSubscriberChannel
}: {
  domainEventStore: DomainEventStore;
  newDomainEventSubscriber: Subscriber<DomainEvent<DomainEventData>>;
  newDomainEventSubscriberChannel: string;
}): RequestHandler {
  return async function (req, res): Promise<void> {
    const fromRevisionGlobalParsed = Number(req.query.fromRevisionGlobal);
    const toRevisionGlobalParsed = Number(req.query.toRevisionGlobal);

    const fromRevisionGlobal = isNaN(fromRevisionGlobalParsed) ? undefined : fromRevisionGlobalParsed;
    const toRevisionGlobal = isNaN(toRevisionGlobalParsed) ? undefined : toRevisionGlobalParsed;
    const observe = req.query.observe === 'true';

    const domainEventStream = await domainEventStore.getReplay({ fromRevisionGlobal, toRevisionGlobal });

    domainEventStream.on('data', (data): void => {
      writeLine({ res, data });
    });

    domainEventStream.on('end', async (): Promise<void> => {
      if (observe) {
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
      } else {
        res.end();
      }
    });
  };
};

export { getReplay };
