import { Application } from '../../../../common/application/Application';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventWithState } from '../../../../common/elements/DomainEventWithState';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { getDomainEventWithStateSchema } from '../../../../common/schemas/getDomainEventWithStateSchema';
import { OnReceiveDomainEvent } from '../../OnReceiveDomainEvent';
import { State } from '../../../../common/elements/State';
import typer from 'content-type';
import { validateDomainEventWithState } from '../../../../common/validators/validateDomainEventWithState';
import { Value } from 'validate-value';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';

const logger = flaschenpost.getLogger();

const postDomainEvent = {
  description: 'Accepts a domain event for further processing.',
  path: '',

  request: {
    body: getDomainEventWithStateSchema()
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
        const error = new errors.DomainEventMalformed(ex.message);

        res.status(400).json({
          code: error.code,
          message: error.message
        });

        return;
      }

      const domainEvent = new DomainEventWithState<DomainEventData, State>(req.body);

      try {
        validateDomainEventWithState({ domainEvent, application });
      } catch (ex) {
        res.status(400).json({
          code: ex.code,
          message: ex.message
        });

        return;
      }

      logger.info('Domain event received.', { domainEvent });

      try {
        await onReceiveDomainEvent({ domainEvent });

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
