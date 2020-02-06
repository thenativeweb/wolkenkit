import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventWithState } from '../../../../common/elements/DomainEventWithState';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { OnReceiveDomainEvent } from '../../OnReceiveDomainEvent';
import { RequestHandler } from 'express';
import { State } from '../../../../common/elements/State';
import typer from 'content-type';
import { validateDomainEventWithState } from '../../../../common/validators/validateDomainEventWithState';

const logger = flaschenpost.getLogger();

const postDomainEvent = function ({ onReceiveDomainEvent, applicationDefinition }: {
  onReceiveDomainEvent: OnReceiveDomainEvent;
  applicationDefinition: ApplicationDefinition;
}): RequestHandler {
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

    const domainEvent = new DomainEventWithState<DomainEventData, State>(req.body);

    try {
      validateDomainEventWithState({ domainEvent, applicationDefinition });
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
    } catch {
      const ex = new errors.UnknownError();

      res.status(500).json({
        code: ex.code,
        message: ex.message
      });

      return;
    }

    res.status(200).end();
  };
};

export { postDomainEvent };
