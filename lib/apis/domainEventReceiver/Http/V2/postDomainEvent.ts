import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventWithState } from '../../../../common/elements/DomainEventWithState';
import { flaschenpost } from 'flaschenpost';
import { OnReceiveDomainEvent } from '../../OnReceiveDomainEvent';
import { State } from '../../../../common/elements/State';
import typer from 'content-type';
import { validateDomainEventWithState } from '../../../../common/validators/validateDomainEventWithState';
import { Request, RequestHandler, Response } from 'express-serve-static-core';

const logger = flaschenpost.getLogger();

const postDomainEvent = function ({ onReceiveDomainEvent, applicationDefinition }: {
  onReceiveDomainEvent: OnReceiveDomainEvent;
  applicationDefinition: ApplicationDefinition;
}): RequestHandler {
  return async function (req: Request, res: Response): Promise<any> {
    let contentType: typer.ParsedMediaType;

    try {
      contentType = typer.parse(req);
    } catch {
      return res.status(415).send('Header content-type must be application/json.');
    }

    if (contentType.type !== 'application/json') {
      return res.status(415).send('Header content-type must be application/json.');
    }

    const domainEvent = new DomainEventWithState<DomainEventData, State>(req.body);

    try {
      validateDomainEventWithState({ domainEvent, applicationDefinition });
    } catch (ex) {
      return res.status(400).send(ex.message);
    }

    logger.info('Domain event received.', { domainEvent });

    try {
      await onReceiveDomainEvent({ domainEvent });
    } catch {
      res.status(500).end();

      return;
    }

    res.status(200).end();
  };
};

export { postDomainEvent };
