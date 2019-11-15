import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { ClientMetadata } from '../../../../common/utils/http/ClientMetadata';
import { Command } from '../../../../common/elements/Command';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { OnReceiveCommand } from '../../OnReceiveCommand';
import { RequestHandler } from 'express-serve-static-core';
import typer from 'content-type';
import { uuid } from 'uuidv4';
import { validateCommand } from '../../../../common/validators/validateCommand';

const logger = flaschenpost.getLogger();

const postCommand = function ({ onReceiveCommand, applicationDefinition }: {
  onReceiveCommand: OnReceiveCommand;
  applicationDefinition: ApplicationDefinition;
}): RequestHandler {
  return async function (req, res): Promise<void> {
    if (!req.token || !req.user) {
      res.status(401).end();
      throw new errors.NotAuthenticatedError('Client information missing in request.');
    }

    try {
      const contentType = typer.parse(req);

      if (contentType.type !== 'application/json') {
        throw new errors.RequestMalformed();
      }
    } catch {
      res.status(415).send('Header content-type must be application/json.');

      return;
    }

    const command = new Command(req.body);

    try {
      validateCommand({ command, applicationDefinition });
    } catch (ex) {
      res.status(400).send(ex.message);

      return;
    }

    const commandId = uuid();
    const commandWithMetadata = new CommandWithMetadata({
      ...command,
      id: commandId,
      metadata: {
        causationId: commandId,
        correlationId: commandId,
        timestamp: Date.now(),
        client: new ClientMetadata({ req }),
        initiator: { user: req.user }
      }
    });

    logger.info('Command received.', { command: commandWithMetadata });

    try {
      await onReceiveCommand({ command: commandWithMetadata });
    } catch {
      res.status(500).end();

      return;
    }

    res.status(200).json({ id: commandId });
  };
};

export { postCommand };
