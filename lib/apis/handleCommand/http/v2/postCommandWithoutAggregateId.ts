import { Application } from '../../../../common/application/Application';
import { ClientMetadata } from '../../../../common/utils/http/ClientMetadata';
import { Command } from '../../../../common/elements/Command';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { CustomError } from 'defekt';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { getCommandSchema } from '../../../../common/schemas/getCommandSchema';
import { OnReceiveCommand } from '../../OnReceiveCommand';
import { Schema } from '../../../../common/elements/Schema';
import typer from 'content-type';
import { v4 } from 'uuid';
import { validateCommand } from '../../../../common/validators/validateCommand';
import { Value } from 'validate-value';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';

const logger = flaschenpost.getLogger();

const postCommandWithoutAggregateId = {
  description: 'Accepts a command for further processing.',
  path: ':contextName/:aggregateName/:commandName',

  request: {
    body: { type: 'object' }
  },
  response: {
    statusCodes: [ 200, 400, 401, 415 ],
    body: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        aggregateIdentifier: {
          type: 'object',
          properties: {
            aggregate: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' }
              },
              required: [ 'id' ],
              additionalProperties: false
            }
          },
          required: [ 'aggregate' ],
          additionalProperties: false
        }
      },
      required: [ 'id', 'aggregateIdentifier' ],
      additionalProperties: false
    } as Schema
  },

  getHandler ({ onReceiveCommand, application }: {
    onReceiveCommand: OnReceiveCommand;
    application: Application;
  }): WolkenkitRequestHandler {
    const responseBodySchema = new Value(postCommandWithoutAggregateId.response.body);

    return async function (req, res): Promise<void> {
      if (!req.token || !req.user) {
        const ex = new errors.NotAuthenticated('Client information missing in request.');

        res.status(401).json({
          code: ex.code,
          message: ex.message
        });

        throw ex;
      }

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

      const aggregateId = v4();
      const command = new Command({
        aggregateIdentifier: {
          context: {
            name: req.params.contextName
          },
          aggregate: {
            name: req.params.aggregateName,
            id: aggregateId
          }
        },
        name: req.params.commandName,
        data: req.body
      });

      try {
        new Value(getCommandSchema()).validate(command, { valueName: 'command' });
      } catch (ex: unknown) {
        const error = new errors.RequestMalformed((ex as Error).message);

        res.status(400).json({
          code: error.code,
          message: error.message
        });

        return;
      }

      try {
        validateCommand({ command, application });
      } catch (ex: unknown) {
        res.status(400).json({
          code: (ex as CustomError).code,
          message: (ex as CustomError).message
        });

        return;
      }

      const commandId = v4();
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

      logger.info(
        'Received command.',
        withLogMetadata('api', 'handleCommand', { command: commandWithMetadata })
      );

      try {
        await onReceiveCommand({ command: commandWithMetadata });

        const response = {
          id: commandId,
          aggregateIdentifier: {
            aggregate: {
              id: commandWithMetadata.aggregateIdentifier.aggregate.id
            }
          }
        };

        responseBodySchema.validate(response, { valueName: 'responseBody' });

        res.status(200).json(response);
      } catch (ex: unknown) {
        logger.error(
          'An unknown error occured.',
          withLogMetadata('api', 'handleCommand', { ex })
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

export { postCommandWithoutAggregateId };
