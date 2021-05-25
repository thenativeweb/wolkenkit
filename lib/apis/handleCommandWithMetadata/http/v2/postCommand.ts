import { Application } from '../../../../common/application/Application';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { flaschenpost } from 'flaschenpost';
import { getCommandWithMetadataSchema } from '../../../../common/schemas/getCommandWithMetadataSchema';
import { isCustomError } from 'defekt';
import { OnReceiveCommand } from '../../OnReceiveCommand';
import { Parser } from 'validate-value';
import { Schema } from '../../../../common/elements/Schema';
import { validateCommandWithMetadata } from '../../../../common/validators/validateCommandWithMetadata';
import { validateContentType } from '../../../base/validateContentType';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import * as errors from '../../../../common/errors';

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
    const requestBodyParser = new Parser(postCommand.request.body),
          responseBodyParser = new Parser(postCommand.response.body);

    return async function (req, res): Promise<void> {
      try {
        validateContentType({
          expectedContentType: 'application/json',
          req
        });

        requestBodyParser.parse(
          req.body,
          { valueName: 'requestBody' }
        ).unwrapOrThrow(
          (err): Error => new errors.CommandMalformed(err.message)
        );

        const command = new CommandWithMetadata(req.body);

        validateCommandWithMetadata({ command, application });

        logger.debug(
          'Received command.',
          withLogMetadata('api', 'handleCommandWithMetadata', { command })
        );

        await onReceiveCommand({ command });

        const response = { id: command.id };

        responseBodyParser.parse(
          response,
          { valueName: 'responseBody' }
        ).unwrapOrThrow();

        res.status(200).json(response);
      } catch (ex: unknown) {
        const error = isCustomError(ex) ?
          ex :
          new errors.UnknownError({ cause: ex as Error });

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
          default: {
            logger.error(
              'An unknown error occured.',
              withLogMetadata('api', 'handleCommandWithMetadata', { error })
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

export { postCommand };
