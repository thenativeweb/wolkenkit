import { Application } from '../../../../common/application/Application';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { getDomainEventSchema } from '../../../../common/schemas/getDomainEventSchema';
import { OnReceiveDomainEvent } from '../../OnReceiveDomainEvent';
import typer from 'content-type';
import { validateDomainEvent } from '../../../../common/validators/validateDomainEvent';
import { validateFlowNames } from '../../../../common/validators/validateFlowNames';
import { Value } from 'validate-value';
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
    }
  },
  response: {
    statusCodes: [ 200, 400, 415 ],
    body: { type: 'object' }
  },

  getHandler ({ onReceiveDomainEvent, application }: {
    onReceiveDomainEvent: OnReceiveDomainEvent;
    application: Application;
  }): WolkenkitRequestHandler {
    const requestBodySchema = new Value(postDomainEvent.request.body),
          responseBodySchema = new Value(postDomainEvent.response.body);

    return async function (req, res): Promise<void> {
      let contentType: typer.ParsedMediaType;

      try {
        contentType = typer.parse(req);

        if (contentType.type !== 'application/json') {
          throw new errors.RequestMalformed();
        }
      } catch {
        const ex = new errors.RequestMalformed('Header content-type must be application/json.');

        res.status(415).json({
          code: ex.code,
          message: ex.message
        });

        return;
      }

      try {
        requestBodySchema.validate(req.body);
      } catch (ex) {
        const error = new errors.RequestMalformed(ex.message);

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
      } catch (ex) {
        res.status(400).json({
          code: ex.code,
          message: ex.message
        });

        return;
      }

      logger.info('Domain event received.', { flowNames, domainEvent });

      try {
        await onReceiveDomainEvent({ flowNames, domainEvent });

        const response = {};

        responseBodySchema.validate(response);

        res.status(200).json(response);
      } catch (ex) {
        logger.error('Unknown error occured.', { ex });

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
