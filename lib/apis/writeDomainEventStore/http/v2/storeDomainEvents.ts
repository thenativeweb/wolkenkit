import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { errors } from '../../../../common/errors';
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
      const ex = new errors.ContentTypeMismatch('Header content-type must be application/json.');

      return res.status(415).json({
        code: ex.code,
        message: ex.message
      });
    }

    if (contentType.type !== 'application/json') {
      const ex = new errors.ContentTypeMismatch('Header content-type must be application/json.');

      return res.status(415).json({
        code: ex.code,
        message: ex.message
      });
    }

    if (!Array.isArray(req.body)) {
      const ex = new errors.RequestMalformed('Request body must be an array of domain events.');

      return res.status(400).json({
        code: ex.code,
        message: ex.message
      });
    }

    if (req.body.length === 0) {
      const ex = new errors.RequestMalformed('Domain events are missing.');

      return res.status(400).json({
        code: ex.code,
        message: ex.message
      });
    }

    let domainEvents;

    try {
      domainEvents = req.body.map((domainEvent): DomainEvent<DomainEventData> => new DomainEvent(domainEvent));

      const domainEventSchema = getDomainEventSchema();

      domainEvents.forEach((domainEvent): void => {
        domainEventSchema.validate(domainEvent, { valueName: 'domainEvent' });
      });
    } catch (ex) {
      const error = new errors.DomainEventMalformed(ex.message);

      return res.status(400).json({
        code: error.code,
        message: error.message
      });
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
      return res.status(400).json({
        code: ex.code ?? 'EUNKNOWNERROR',
        message: ex.message
      });
    }
  };
};

export { storeDomainEvents };
