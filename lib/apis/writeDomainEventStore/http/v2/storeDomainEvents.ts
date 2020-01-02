import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { getDomainEventSchema } from '../../../../common/schemas/getDomainEventSchema';
import { Publisher } from '../../../../messaging/pubSub/Publisher';
import { RequestHandler } from 'express-serve-static-core';
import typer from 'content-type';

const storeDomainEvents = function ({
  domainEventStore,
  newDomainEventPublisher,
  newDomainEventPublisherChannel
}: {
  domainEventStore: DomainEventStore;
  newDomainEventPublisher: Publisher<DomainEvent<DomainEventData>>;
  newDomainEventPublisherChannel: string;
}): RequestHandler {
  return async function (req, res): Promise<any> {
    let contentType: typer.ParsedMediaType;

    try {
      contentType = typer.parse(req);
    } catch {
      return res.status(415).send('Header content-type must be application/json.');
    }

    if (contentType.type !== 'application/json') {
      return res.status(415).send('Header content-type must be application/json.');
    }

    if (!Array.isArray(req.body)) {
      return res.status(400).send('Request body must be an array of domain events.');
    }

    if (req.body.length === 0) {
      return res.status(400).send('Domain events are missing.');
    }

    let domainEvents;

    try {
      domainEvents = req.body.map((domainEvent): DomainEvent<DomainEventData> => new DomainEvent(domainEvent));

      const domainEventSchema = getDomainEventSchema();

      domainEvents.forEach((domainEvent): void => {
        domainEventSchema.validate(domainEvent, { valueName: 'domainEvent' });
      });
    } catch (ex) {
      return res.status(400).send(ex.message);
    }

    try {
      const storedDomainEvents = await domainEventStore.storeDomainEvents({ domainEvents });

      for (const domainEvent of storedDomainEvents) {
        await newDomainEventPublisher.publish({
          channel: newDomainEventPublisherChannel,
          message: domainEvent
        });
      }

      res.json(storedDomainEvents);
    } catch (ex) {
      return res.status(400).send(ex.message);
    }
  };
};

export { storeDomainEvents };
