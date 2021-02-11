import { Application } from '../../../../common/application/Application';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { CustomError } from 'defekt';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { getCommandWithMetadataSchema } from '../../../../common/schemas/getCommandWithMetadataSchema';
import { OnReceiveCommand } from '../../OnReceiveCommand';
import { Schema } from '../../../../common/elements/Schema';
import typer from 'content-type';
import { validateCommandWithMetadata } from '../../../../common/validators/validateCommandWithMetadata';
import { Value } from 'validate-value';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';

const logger = flaschenpost.getLogger();

const postCommand = {
  description: 'Accepts a command with metadata for further processing.',
  path: '',

  request: {
    body: getCommandWithMetadataSchema()
  },
  response: {
    statusCodes: [ 200, 400, 415 ],

    body: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' }
      },
      required: [ 'id' ],
      additionalProperties: false
    } as Schema
  },

  getHandler ({ onReceiveCommand, application }: {
    onReceiveCommand: OnReceiveCommand;
    application: Application;
  }): WolkenkitRequestHandler {
    const requestBodySchema = new Value(postCommand.request.body),
          responseBodySchema = new Value(postCommand.response.body);

    return async function (req, res): Promise<void> {
      try {
        const contentType = typer.parse(req);

        if (contentType.type !== 'application/json') {
          throw new errors.ContentTypeMismatch();
        }
      } catch {
        const ex = new errors.ContentTypeMismatch('Header content-type must be application/json.');

        res.status(415).json({
          code: ex.code,
          message: ex.message
        });

        return;
      }

      try {
        requestBodySchema.validate(req.body, { valueName: 'requestBody' });
      } catch (ex: unknown) {
        const error = new errors.CommandMalformed((ex as Error).message);

        res.status(400).json({
          code: error.code,
          message: error.message
        });

        return;
      }

      const command = new CommandWithMetadata(req.body);

      try {
        validateCommandWithMetadata({ command, application });
      } catch (ex: unknown) {
        res.status(400).json({
          code: (ex as CustomError).code,
          message: (ex as CustomError).message
        });

        return;
      }

      logger.info(
        'Received command.',
        withLogMetadata('api', 'handleCommandWithMetadata', { command })
      );

      try {
        await onReceiveCommand({ command });

        const response = { id: command.id };

        responseBodySchema.validate(response, { valueName: 'responseBody' });

        res.status(200).json(response);
      } catch (ex: unknown) {
        logger.error(
          'An unknown error occured.',
          withLogMetadata('api', 'handleCommandWithMetadata', { err: ex })
        );

        const error = new errors.UnknownError();

        res.status(500).json({
          code: error.code,
          message: error.message
        });
      }
    };
  }
};

export { postCommand };
