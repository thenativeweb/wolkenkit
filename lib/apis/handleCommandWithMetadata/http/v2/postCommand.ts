import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { OnReceiveCommand } from '../../OnReceiveCommand';
import { RequestHandler } from 'express';
import typer from 'content-type';
import { validateCommandWithMetadata } from '../../../../common/validators/validateCommandWithMetadata';

const logger = flaschenpost.getLogger();

const postCommand = function ({ onReceiveCommand, applicationDefinition }: {
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
      const ex = new errors.RequestMalformed('Header content-type must be application/json.');

      res.status(415).json({
        code: ex.code,
        message: ex.message
      });

      return;
    }

    const command = new CommandWithMetadata(req.body);

    try {
      validateCommandWithMetadata({ command, applicationDefinition });
    } catch (ex) {
      res.status(400).json({
        code: ex.code,
        message: ex.message
      });

      return;
    }

    logger.info('Command received.', { command });

    try {
      await onReceiveCommand({ command });
    } catch (ex) {
      logger.error('An error occured in on receive callback.', { ex });

      const customError = new errors.UnknownError();

      res.status(500).json({
        code: customError.code,
        message: customError.message
      });

      return;
    }

    res.status(200).json({ id: command.id });
  };
};

export { postCommand };
