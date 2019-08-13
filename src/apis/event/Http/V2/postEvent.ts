import Application from '../../../../common/application/Application';
import EventInternal from '../../../../common/elements/EventInternal';
import flaschenpost from 'flaschenpost';
import typer from 'content-type';
import { Request, RequestHandler, Response } from 'express-serve-static-core';

const logger = flaschenpost.getLogger();

export type OnReceiveEvent = any;

const postEvent = function ({ onReceiveEvent, application }: {
  onReceiveEvent: OnReceiveEvent;
  application: Application;
}): RequestHandler {
  return async function (req: Request, res: Response): Promise<any> {
    let contentType: typer.ParsedMediaType,
        event = req.body;

    try {
      contentType = typer.parse(req);
    } catch {
      return res.status(415).send('Header content-type must be application/json.');
    }

    if (contentType.type !== 'application/json') {
      return res.status(415).send('Header content-type must be application/json.');
    }

    try {
      EventInternal.validate({ event, application });
    } catch (ex) {
      return res.status(400).send(ex.message);
    }

    event = EventInternal.deserialize(event);

    logger.info('Event received.', { event });

    try {
      await onReceiveEvent({ event });
    } catch {
      res.status(500).end();

      return;
    }

    res.status(200).end();
  };
};

export default postEvent;
