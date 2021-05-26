import { Application } from '../../../../common/application/Application';
import { ClientMetadata } from '../../../../common/utils/http/ClientMetadata';
import { flaschenpost } from 'flaschenpost';
import { getItemIdentifierSchema } from '../../../../common/schemas/getItemIdentifierSchema';
import { GraphqlIncompatibleSchema } from '../../../../common/elements/Schema';
import { isCustomError } from 'defekt';
import { ItemIdentifier } from '../../../../common/elements/ItemIdentifier';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
import { OnCancelCommand } from '../../OnCancelCommand';
import { Parser } from 'validate-value';
import { validateContentType } from '../../../base/validateContentType';
import { validateItemIdentifier } from '../../../../common/validators/validateItemIdentifier';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import * as errors from '../../../../common/errors';

const logger = flaschenpost.getLogger();

const cancelCommand = {
  description: 'Cancels a command that has not been processed yet.',
  path: 'cancel',

  request: {
    body: getItemIdentifierSchema()
  },
  response: {
    statusCodes: [ 200, 400, 401, 404, 415 ],
    body: { type: 'object' } as GraphqlIncompatibleSchema
  },

  getHandler ({ onCancelCommand, application }: {
    onCancelCommand: OnCancelCommand;
    application: Application;
  }): WolkenkitRequestHandler {
    const requestBodyParser = new Parser(cancelCommand.request.body),
          responseBodyParser = new Parser(cancelCommand.response.body);

    return async function (req, res): Promise<any> {
      try {
        validateContentType({
          expectedContentType: 'application/json',
          req
        });

        requestBodyParser.parse(
          req.body,
          { valueName: 'requestBody' }
        ).unwrapOrThrow(
          (err): Error => new errors.RequestMalformed(err.message)
        );

        const commandIdentifier: ItemIdentifier = req.body;

        validateItemIdentifier({ itemIdentifier: commandIdentifier, application, itemType: 'command' });

        const commandIdentifierWithClient: ItemIdentifierWithClient = {
          ...commandIdentifier,
          client: new ClientMetadata({ req })
        };

        logger.debug(
          'Received request to cancel command.',
          withLogMetadata('api', 'handleCommand', { commandIdentifierWithClient })
        );

        await onCancelCommand({ commandIdentifierWithClient });

        const response = {};

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
          case errors.CommandNotFound.code: {
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
              withLogMetadata('api', 'handleCommand', { error })
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
