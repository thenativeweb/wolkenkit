import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { OnReceiveMessage } from '../../OnReceiveMessage';
import { RequestHandler } from 'express';
import typer from 'content-type';

const logger = flaschenpost.getLogger();

const postMessage = function ({ onReceiveMessage }: {
  onReceiveMessage: OnReceiveMessage;
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

    const message = req.body;

    logger.info('Message received.');

    try {
      await onReceiveMessage({ message });
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

export { postMessage };
