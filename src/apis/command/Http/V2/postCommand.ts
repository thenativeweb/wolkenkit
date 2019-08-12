import Application from '../../../../common/application/Application';
import ClientMetadata from '../../../../common/utils/http/ClientMetadata';
import CommandExternal from '../../../../common/elements/CommandExternal';
import CommandInternal from '../../../../common/elements/CommandInternal';
import errors from '../../../../common/errors';
import flaschenpost from 'flaschenpost';
import { Purpose } from '.';
import typer from 'content-type';
import { Request, RequestHandler, Response } from 'express-serve-static-core';

const logger = flaschenpost.getLogger();

export type OnReceiveCommand = ({ command }: { command: CommandInternal }) => Promise<void>;

const postCommand = function ({
  purpose,
  onReceiveCommand,
  application
}: {
  purpose: Purpose;
  onReceiveCommand: OnReceiveCommand;
  application: Application;
}): RequestHandler {
  return async function (req: Request, res: Response): Promise<any> {
    if (!req.token || !req.user) {
      res.status(401).end();
      throw new errors.NotAuthenticatedError('Client information missing in request.');
    }

    let command = req.body,
        contentType: typer.ParsedMediaType;

    try {
      contentType = typer.parse(req);
    } catch {
      return res.status(415).send('Header content-type must be application/json.');
    }

    if (contentType.type !== 'application/json') {
      return res.status(415).send('Header content-type must be application/json.');
    }

    switch (purpose) {
      case 'internal':
        try {
          CommandInternal.validate({ command, application });
        } catch (ex) {
          return res.status(400).send(ex.message);
        }

        command = CommandInternal.deserialize(command);
        break;
      case 'external':
        try {
          CommandExternal.validate({ command, application });
        } catch (ex) {
          return res.status(400).send(ex.message);
        }

        command = CommandInternal.deserialize({
          ...command,
          annotations: {
            client: new ClientMetadata({ req }),
            initiator: { user: { id: req.user.id, claims: req.user.claims }}
          }
        });
        break;
      default:
        throw new errors.InvalidOperation(`Purpose should have been 'internal' or 'external'.`);
    }

    logger.info('Command received.', { command });

    try {
      await onReceiveCommand({ command });
    } catch {
      res.status(500).end();

      return;
    }

    res.status(200).end();
  };
};

export default postCommand;
