import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { OnReceiveCommand } from '../../OnReceiveCommand';
import { RequestHandler } from 'express-serve-static-core';
import typer from 'content-type';
import { validateCommandWithMetadata } from '../../../../common/validators/validateCommandWithMetadata';

const logger = flaschenpost.getLogger();

const postCommandWithMetadata = function ({ onReceiveCommand, applicationDefinition }: {
  onReceiveCommand: OnReceiveCommand;
  applicationDefinition: ApplicationDefinition;
}): RequestHandler {
  return async function (req, res): Promise<void> {
    try {
      const contentType = typer.parse(req);

      if (contentType.type !== 'application/json') {
        throw new errors.RequestMalformed();
      }
    } catch {
      res.status(415).send('Header content-type must be application/json.');

      return;
    }

    const command = new CommandWithMetadata(req.body);

    try {
      validateCommandWithMetadata({ command, applicationDefinition });
    } catch (ex) {
      res.status(400).send(ex.message);

      return;
    }

    logger.info('Command received.', { command });

    try {
      await onReceiveCommand({ command });
    } catch {
      res.status(500).end();

      return;
    }

    res.status(200).json({ id: command.id });
  };
};

export { postCommandWithMetadata };
