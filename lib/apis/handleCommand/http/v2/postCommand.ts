import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { ClientMetadata } from '../../../../common/utils/http/ClientMetadata';
import { Command } from '../../../../common/elements/Command';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { OnReceiveCommand } from '../../OnReceiveCommand';
import { RequestHandler } from 'express';
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
      const ex = new errors.NotAuthenticatedError('Client information missing in request.');

      res.status(401).json({
        code: ex.code,
        message: ex.message
      });

      throw ex;
    }

    try {
      const contentType = typer.parse(req);

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

    const command = new Command(req.body);

    try {
      validateCommand({ command, applicationDefinition });
    } catch (ex) {
      res.status(400).json({
        code: ex.code,
        message: ex.message
      });

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
      const ex = new errors.UnknownError();

      res.status(500).json({
        code: ex.code,
        message: ex.message
      });

      return;
    }

    res.status(200).json({ id: commandId });
  };
};

export { postCommand };
