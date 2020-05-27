import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { getCommandWithMetadataSchema } from '../../../../common/schemas/getCommandWithMetadataSchema';
import { jsonSchema } from 'uuidv4';
import { OnReceiveCommand } from '../../OnReceiveCommand';
import { RequestHandler } from 'express';
import typer from 'content-type';
import { validateCommandWithMetadata } from '../../../../common/validators/validateCommandWithMetadata';
import { Value } from 'validate-value';

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
        id: jsonSchema.v4
      },
      required: [ 'id' ],
      additionalProperties: false
    }
  },

  getHandler ({ onReceiveCommand, applicationDefinition }: {
    onReceiveCommand: OnReceiveCommand;
    applicationDefinition: ApplicationDefinition;
  }): RequestHandler {
    const requestBodySchema = new Value(postCommand.request.body),
          responseBodySchema = new Value(postCommand.response.body);

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

      try {
        requestBodySchema.validate(req.body);
      } catch (ex) {
        const error = new errors.CommandMalformed(ex.message);

        res.status(400).json({
          code: error.code,
          message: error.message
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

        const response = { id: command.id };

        responseBodySchema.validate(response);

        res.status(200).json(response);
      } catch (ex) {
        logger.error('Unknown error occured.', { ex });

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
