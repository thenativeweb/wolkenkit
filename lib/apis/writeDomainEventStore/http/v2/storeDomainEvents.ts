import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { flaschenpost } from 'flaschenpost';
import { getDomainEventSchema } from '../../../../common/schemas/getDomainEventSchema';
import { isCustomError } from 'defekt';
import { Parser } from 'validate-value';
import { Schema } from '../../../../common/elements/Schema';
import { validateContentType } from '../../../base/validateContentType';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import * as errors from '../../../../common/errors';

const domainEventParser = new Parser(getDomainEventSchema());
const logger = flaschenpost.getLogger();

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
    statusCodes: [ 200, 400, 409, 415 ],

    body: { type: 'object' } as Schema
  },

  getHandler ({ domainEventStore }: {
    domainEventStore: DomainEventStore;
  }): WolkenkitRequestHandler {
    const responseBodySchema = new Parser(storeDomainEvents.response.body);

    return async function (req, res): Promise<any> {
      try {
        validateContentType({
          expectedContentType: 'application/json',
          req
        });

        if (!Array.isArray(req.body)) {
          throw new errors.RequestMalformed('Request body must be an array of domain events.');
        }

        if (req.body.length === 0) {
          throw new errors.ParameterInvalid('Domain events are missing.');
        }

        const domainEvents = req.body.map(
          (domainEvent: any): DomainEvent<DomainEventData> => new DomainEvent(domainEvent)
        );

        for (const domainEvent of domainEvents) {
          domainEventParser.parse(domainEvent).unwrapOrThrow(
            (err): Error => new errors.DomainEventMalformed(err.message)
          );
        }

        await domainEventStore.storeDomainEvents({ domainEvents });

        const response = {};

        responseBodySchema.parse(
          response,
          { valueName: 'responseBody' }
        ).unwrapOrThrow();

        res.status(200).json(response);
      } catch (ex: unknown) {
        const error = isCustomError(ex) ?
          ex :
          new errors.UnknownError({ cause: ex as Error });

        switch (error.code) {
          case errors.ContentTypeMismatch.code: {
            res.status(415).json({
              code: error.code,
              message: error.message
            });

            return;
          }
          case errors.RequestMalformed.code:
          case errors.ParameterInvalid.code:
          case errors.DomainEventMalformed.code: {
            res.status(400).json({
              code: error.code,
              message: error.message
            });

            return;
          }
          case errors.RevisionAlreadyExists.code: {
            res.status(409).json({
              code: error.code,
              message: error.message
            });

            return;
          }
          default: {
            logger.error(
              'An unknown error occured.',
              withLogMetadata('api', 'writeDomainEventStore', { error })
            );

            res.status(500).json({
              code: error.code,
              message: error.message
            });
          }
        }
      }
    };
  }
};

export { storeDomainEvents };
