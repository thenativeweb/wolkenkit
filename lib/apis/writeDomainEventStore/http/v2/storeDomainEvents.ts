import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { errors } from '../../../../common/errors';
import { getDomainEventSchema } from '../../../../common/schemas/getDomainEventSchema';
import typer from 'content-type';
import { Value } from 'validate-value';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';

const storeDomainEvents = {
  description: 'Stores domain events.',
  path: 'store-domain-events',

  request: {
    body: {
      type: 'array',
      items: getDomainEventSchema()
    }
  },
  response: {
    statusCodes: [ 200, 400, 415 ],

    body: {
      type: 'array',
      items: getDomainEventSchema()
    }
  },

  getHandler ({
    domainEventStore
  }: {
    domainEventStore: DomainEventStore;
  }): WolkenkitRequestHandler {
    const requestBodySchema = new Value(storeDomainEvents.request.body),
          responseBodySchema = new Value(storeDomainEvents.response.body);

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
        const ex = new errors.ParameterInvalid('Domain events are missing.');

        return res.status(400).json({
          code: ex.code,
          message: ex.message
        });
      }

      try {
        requestBodySchema.validate(req.body);
      } catch (ex) {
        const error = new errors.RequestMalformed(ex.message);

        return res.status(400).json({
          code: error.code,
          message: error.message
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

        responseBodySchema.validate(storedDomainEvents);

        res.json(storedDomainEvents);
      } catch (ex) {
        return res.status(400).json({
          code: ex.code ?? 'EUNKNOWNERROR',
          message: ex.message
        });
      }
    };
  }
};

export { storeDomainEvents };
