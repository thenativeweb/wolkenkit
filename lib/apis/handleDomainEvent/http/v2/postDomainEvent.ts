import { Application } from '../../../../common/application/Application';
import { CustomError } from 'defekt';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { getDomainEventSchema } from '../../../../common/schemas/getDomainEventSchema';
import { OnReceiveDomainEvent } from '../../OnReceiveDomainEvent';
import { Schema } from '../../../../common/elements/Schema';
import typer from 'content-type';
import { validateDomainEvent } from '../../../../common/validators/validateDomainEvent';
import { validateFlowNames } from '../../../../common/validators/validateFlowNames';
import { Value } from 'validate-value';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';

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
    const requestBodySchema = new Value(postDomainEvent.request.body),
          responseBodySchema = new Value(postDomainEvent.response.body);

    return async function (req, res): Promise<void> {
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

      try {
        requestBodySchema.validate(req.body, { valueName: 'requestBody' });
      } catch (ex: unknown) {
        const error = new errors.RequestMalformed((ex as Error).message);

        res.status(400).json({
          code: error.code,
          message: error.message
        });

        return;
      }

      const flowNames = req.body.flowNames ?? Object.keys(application.flows);
      const domainEvent = new DomainEvent<DomainEventData>(req.body.domainEvent);

      try {
        validateFlowNames({ flowNames, application });
        validateDomainEvent({ domainEvent, application });
      } catch (ex: unknown) {
        res.status(400).json({
          code: (ex as CustomError).code,
          message: (ex as CustomError).message
        });

        return;
      }

      logger.info(
        'Received domain event.',
        withLogMetadata('api', 'handleDomainEvent', { flowNames, domainEvent })
      );

      try {
        await onReceiveDomainEvent({ flowNames, domainEvent });

        const response = {};

        responseBodySchema.validate(response, { valueName: 'responseBody' });

        res.status(200).json(response);
      } catch (ex: unknown) {
        logger.error(
          'An unknown error occured.',
          withLogMetadata('api', 'handleDomainEvent', { ex })
        );

        const error = new errors.UnknownError();

        res.status(500).json({
          code: error.code,
          message: error.message
        });
      }
    };
  }
};

export { postDomainEvent };
