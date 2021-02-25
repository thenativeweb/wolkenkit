import { Application } from '../../../../common/application/Application';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { getItemIdentifierWithClientSchema } from '../../../../common/schemas/getItemIdentifierWithClientSchema';
import { isCustomError } from 'defekt';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
import { OnCancelCommand } from '../../OnCancelCommand';
import { Schema } from '../../../../common/elements/Schema';
import { validateContentType } from '../../../base/validateContentType';
import { validateItemIdentifier } from '../../../../common/validators/validateItemIdentifier';
import { Value } from 'validate-value';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';

const logger = flaschenpost.getLogger();

const cancelCommand = {
  description: 'Cancels a command that has not been processed yet.',
  path: 'cancel',

  request: {
    body: getItemIdentifierWithClientSchema()
  },
  response: {
    statusCodes: [ 200, 400, 404, 415 ],
    body: { type: 'object' } as Schema
  },

  getHandler ({ onCancelCommand, application }: {
    onCancelCommand: OnCancelCommand;
    application: Application;
  }): WolkenkitRequestHandler {
    const requestBodySchema = new Value(cancelCommand.request.body),
          responseBodySchema = new Value(cancelCommand.response.body);

    return async function (req, res): Promise<any> {
      try {
        validateContentType({
          expectedContentType: 'application/json',
          req
        });

        try {
          requestBodySchema.validate(req.body, { valueName: 'requestBody' });
        } catch (ex: unknown) {
          throw new errors.RequestMalformed((ex as Error).message);
        }

        const commandIdentifierWithClient: ItemIdentifierWithClient = req.body;

        validateItemIdentifier({ itemIdentifier: commandIdentifierWithClient, application, itemType: 'command' });

        logger.debug(
          'Received request to cancel command.',
          withLogMetadata('api', 'handleCommandWithMetadata', { commandIdentifierWithClient })
        );

        await onCancelCommand({ commandIdentifierWithClient });

        const response = {};

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
          case errors.CommandNotFound.code: {
            res.status(400).json({
              code: error.code,
              message: error.message
            });

            return;
          }
          case errors.ItemNotFound.code: {
            return res.status(404).json({
              code: error.code,
              message: error.message
            });
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

export { cancelCommand };
