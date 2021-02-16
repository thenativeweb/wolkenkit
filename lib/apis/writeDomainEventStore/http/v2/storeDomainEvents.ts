import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { errors } from '../../../../common/errors';
import { getDomainEventSchema } from '../../../../common/schemas/getDomainEventSchema';
import { isCustomError } from 'defekt';
import { Schema } from '../../../../common/elements/Schema';
import typer from 'content-type';
import { Value } from 'validate-value';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';

const domainEventSchema = new Value(getDomainEventSchema());

const storeDomainEvents = {
  description: 'Stores domain events.',
  path: 'store-domain-events',

  request: {
    body: {
      type: 'array',
      items: getDomainEventSchema()
    } as Schema
  },
  response: {
    statusCodes: [ 200, 400, 415 ],

    body: { type: 'object' } as Schema
  },

  getHandler ({ domainEventStore }: {
    domainEventStore: DomainEventStore;
  }): WolkenkitRequestHandler {
    const requestBodySchema = new Value(storeDomainEvents.request.body),
          responseBodySchema = new Value(storeDomainEvents.response.body);

    return async function (req, res): Promise<any> {
      try {
        const contentType = typer.parse(req);

        if (contentType.type !== 'application/json') {
          throw new errors.ContentTypeMismatch();
        }
      } catch {
        const ex = new errors.ContentTypeMismatch('Header content-type must be application/json.');

        res.status(415).json({
          code: ex.code,
          message: ex.message
        });

        return;
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
        requestBodySchema.validate(req.body, { valueName: 'requestBody' });
      } catch (ex: unknown) {
        const error = new errors.RequestMalformed((ex as Error).message);

        return res.status(400).json({
          code: error.code,
          message: error.message
        });
      }

      let domainEvents;

      try {
        domainEvents = req.body.map((domainEvent): DomainEvent<DomainEventData> => new DomainEvent(domainEvent));

        domainEvents.forEach((domainEvent): void => {
          domainEventSchema.validate(domainEvent, { valueName: 'domainEvent' });
        });
      } catch (ex: unknown) {
        const error = new errors.DomainEventMalformed((ex as Error).message);

        return res.status(400).json({
          code: error.code,
          message: error.message
        });
      }

      try {
        await domainEventStore.storeDomainEvents({ domainEvents });

        const response = {};

        responseBodySchema.validate(response, { valueName: 'responseBody' });

        res.status(200).json(response);
      } catch (ex: unknown) {
        const error = isCustomError(ex) ?
          ex :
          new errors.UnknownError(undefined, { cause: ex as Error });

        return res.status(400).json({
          code: error.code,
          message: error.message
        });
      }
    };
  }
};

export { storeDomainEvents };
