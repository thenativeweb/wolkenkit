import { Application } from '../../../../common/application/Application';
import { ClientMetadata } from '../../../../common/utils/http/ClientMetadata';
import { Command } from '../../../../common/elements/Command';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { getCommandSchema } from '../../../../common/schemas/getCommandSchema';
import { isCustomError } from 'defekt';
import { OnReceiveCommand } from '../../OnReceiveCommand';
import { Schema } from '../../../../common/elements/Schema';
import { v4 } from 'uuid';
import { validateCommand } from '../../../../common/validators/validateCommand';
import { validateContentType } from '../../../base/validateContentType';
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
      try {
        validateContentType({
          expectedContentType: 'application/json',
          req
        });

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
          throw new errors.RequestMalformed((ex as Error).message);
        }

        validateCommand({ command, application });

        const commandId = v4();
        const commandWithMetadata = new CommandWithMetadata({
          ...command,
          id: commandId,
          metadata: {
            causationId: commandId,
            correlationId: commandId,
            timestamp: Date.now(),
            client: new ClientMetadata({ req }),
            initiator: { user: req.user! }
          }
        });

        logger.debug(
          'Received command.',
          withLogMetadata('api', 'handleCommand', { command: commandWithMetadata })
        );

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
        const error = isCustomError(ex) ?
          ex :
          new errors.UnknownError(undefined, { cause: ex as Error });

        switch (error.code) {
          case errors.ContentTypeMismatch.code: {
            res.status(415).json({
              code: error.code,
              message: error.message
            });

            return;
          }
          case errors.RequestMalformed.code:
          case errors.ContextNotFound.code:
          case errors.AggregateNotFound.code:
          case errors.CommandNotFound.code:
          case errors.CommandMalformed.code: {
            res.status(400).json({
              code: error.code,
              message: error.message
            });

            return;
          }
          case errors.ItemNotFound.code: {
            res.status(404).json({
              code: error.code,
              message: error.message
            });

            return;
          }
          default: {
            logger.error(
              'An unknown error occured.',
              withLogMetadata('api', 'handleCommand', { err: error })
            );

            res.status(500).json({
              code: error.code,
              message: error.message
            });
          }
        }
      }
    };
  }
};

export { postCommandWithoutAggregateId };
