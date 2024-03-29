import { Application } from '../../../../common/application/Application';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { flaschenpost } from 'flaschenpost';
import { getDomainEventSchema } from '../../../../common/schemas/getDomainEventSchema';
import { isCustomError } from 'defekt';
import { OnReceiveDomainEvent } from '../../OnReceiveDomainEvent';
import { Parser } from 'validate-value';
import { Schema } from '../../../../common/elements/Schema';
import { validateContentType } from '../../../base/validateContentType';
import { validateDomainEvent } from '../../../../common/validators/validateDomainEvent';
import { validateFlowNames } from '../../../../common/validators/validateFlowNames';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import * as errors from '../../../../common/errors';

const logger = flaschenpost.getLogger();

const postDomainEvent = {
  description: 'Accepts a domain event for further processing.',
  path: '',

  request: {
    body: {
      type: 'object',
      properties: {
        flowNames: {
          type: 'array',
          items: { type: 'string', minLength: 1 },
          minItems: 1
        },
        domainEvent: getDomainEventSchema()
      },
      required: [ 'domainEvent' ],
      additionalProperties: false
    } as Schema
  },
  response: {
    statusCodes: [ 200, 400, 415 ],
    body: { type: 'object' } as Schema
  },

  getHandler ({ onReceiveDomainEvent, application }: {
    onReceiveDomainEvent: OnReceiveDomainEvent;
    application: Application;
  }): WolkenkitRequestHandler {
    const requestBodyParser = new Parser(postDomainEvent.request.body),
          responseBodyParser = new Parser(postDomainEvent.response.body);

    return async function (req, res): Promise<void> {
      try {
        validateContentType({
          expectedContentType: 'application/json',
          req
        });

        requestBodyParser.parse(
          req.body,
          { valueName: 'requestBody' }
        ).unwrapOrThrow(
          (err): Error => new errors.RequestMalformed(err.message)
        );

        const flowNames = req.body.flowNames ?? Object.keys(application.flows);
        const domainEvent = new DomainEvent<DomainEventData>(req.body.domainEvent);

        validateFlowNames({ flowNames, application });
        validateDomainEvent({ domainEvent, application });

        logger.debug(
          'Received domain event.',
          withLogMetadata('api', 'handleDomainEvent', { flowNames, domainEvent })
        );

        await onReceiveDomainEvent({ flowNames, domainEvent });

        const response = {};

        responseBodyParser.parse(
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
          case errors.FlowNotFound.code:
          case errors.ContextNotFound.code:
          case errors.AggregateNotFound.code:
          case errors.DomainEventNotFound.code:
          case errors.DomainEventMalformed.code:
          case errors.RequestMalformed.code: {
            res.status(400).json({
              code: error.code,
              message: error.message
            });

            return;
          }
          default: {
            logger.error(
              'An unknown error occured.',
              withLogMetadata('api', 'handleDomainEvent', { error })
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

export { postDomainEvent };
