import { Application } from '../../../../common/application/Application';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { getItemIdentifierWithClientSchema } from '../../../../common/schemas/getItemIdentifierWithClientSchema';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
import { OnCancelCommand } from '../../OnCancelCommand';
import typer from 'content-type';
import { validateItemIdentifier } from '../../../../common/validators/validateItemIdentifier';
import { Value } from 'validate-value';
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
    body: { type: 'object' }
  },

  getHandler ({ onCancelCommand, application }: {
    onCancelCommand: OnCancelCommand;
    application: Application;
  }): WolkenkitRequestHandler {
    const requestBodySchema = new Value(cancelCommand.request.body),
          responseBodySchema = new Value(cancelCommand.response.body);

    return async function (req, res): Promise<any> {
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
        requestBodySchema.validate(req.body, { valueName: 'requestBody' });
      } catch (ex) {
        const error = new errors.RequestMalformed(ex.message);

        res.status(400).json({
          code: error.code,
          message: error.message
        });

        return;
      }

      const commandIdentifierWithClient: ItemIdentifierWithClient = req.body;

      try {
        validateItemIdentifier({ itemIdentifier: commandIdentifierWithClient, application, itemType: 'command' });
      } catch (ex) {
        res.status(400).json({
          code: ex.code,
          message: ex.message
        });

        return;
      }

      logger.info('Received request to cancel command.', { commandIdentifierWithClient });

      try {
        await onCancelCommand({ commandIdentifierWithClient });

        const response = {};

        responseBodySchema.validate(response, { valueName: 'responseBody' });

        res.status(200).json(response);
      } catch (ex) {
        switch (ex.code) {
          case errors.ItemNotFound.code: {
            return res.status(404).json({
              code: ex.code,
              message: ex.message
            });
          }
          default: {
            logger.error('An unknown error occured.', { ex });

            const error = new errors.UnknownError();

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
