import { Application } from '../../../../common/application/Application';
import { ClientMetadata } from '../../../../common/utils/http/ClientMetadata';
import { Command } from '../../../../common/elements/Command';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { getCommandSchema } from '../../../../common/schemas/getCommandSchema';
import { OnReceiveCommand } from '../../OnReceiveCommand';
import { Schema } from '../../../../common/elements/Schema';
import typer from 'content-type';
import { validateCommand } from '../../../../common/validators/validateCommand';
import { Value } from 'validate-value';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import { jsonSchema, uuid } from 'uuidv4';

const logger = flaschenpost.getLogger();

const postCommand = {
  description: 'Accepts a command for further processing.',
  path: ':contextName/:aggregateName/:aggregateId/:commandName',

  request: {
    body: { type: 'object' }
  },
  response: {
    statusCodes: [ 200, 400, 401, 415 ],
    body: {
      type: 'object',
      properties: {
        id: jsonSchema.v4
      },
      required: [ 'id' ],
      additionalProperties: false
    } as Schema
  },

  getHandler ({ onReceiveCommand, application }: {
    onReceiveCommand: OnReceiveCommand;
    application: Application;
  }): WolkenkitRequestHandler {
    const responseBodySchema = new Value(postCommand.response.body);

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

      const command = new Command({
        contextIdentifier: {
          name: req.params.contextName
        },
        aggregateIdentifier: {
          name: req.params.aggregateName,
          id: req.params.aggregateId
        },
        name: req.params.commandName,
        data: req.body
      });

      try {
        new Value(getCommandSchema()).validate(command);
      } catch (ex) {
        const error = new errors.RequestMalformed(ex.message);

        res.status(400).json({
          code: error.code,
          message: error.message
        });

        return;
      }

      try {
        validateCommand({ command, application });
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

        const response = { id: commandId };

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
