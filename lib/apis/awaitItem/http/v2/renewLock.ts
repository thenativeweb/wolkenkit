import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { isCustomError } from 'defekt';
import { ItemIdentifier } from '../../../../common/elements/ItemIdentifier';
import { jsonSchema } from '../../../../common/utils/uuid';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';
import { Schema } from '../../../../common/elements/Schema';
import typer from 'content-type';
import { Value } from 'validate-value';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';

const logger = flaschenpost.getLogger();

const renewLock = {
  description: 'Renews the timeout of a locked item in the queue.',
  path: 'renew-lock',

  request: {
    body: {
      type: 'object',
      properties: {
        discriminator: { type: 'string', minLength: 1 },
        token: jsonSchema
      },
      required: [ 'discriminator', 'token' ],
      additionalProperties: false
    } as Schema
  },
  response: {
    statusCodes: [],
    body: { type: 'object' } as Schema
  },

  getHandler<TItem extends object> ({
    priorityQueueStore
  }: {
    priorityQueueStore: PriorityQueueStore<TItem, ItemIdentifier>;
  }): WolkenkitRequestHandler {
    const requestBodySchema = new Value(renewLock.request.body),
          responseBodySchema = new Value(renewLock.response.body);

    return async function (req, res): Promise<void> {
      try {
        const contentType = typer.parse(req);

        if (contentType.type !== 'application/json') {
          throw new errors.RequestMalformed();
        }
      } catch {
        const error = new errors.ContentTypeMismatch('Header content-type must be application/json.');

        res.status(415).json({
          code: error.code,
          message: error.message
        });

        return;
      }

      try {
        requestBodySchema.validate(req.body, { valueName: 'requestBody' });
      } catch (ex: unknown) {
        const error = new errors.RequestMalformed((ex as Error).message);

        res.status(400).json({
          code: error.code,
          message: error.message
        });

        return;
      }

      const { discriminator, token } = req.body;

      try {
        await priorityQueueStore.renewLock({
          discriminator,
          token
        });

        const response = {};

        responseBodySchema.validate(response, { valueName: 'responseBody' });

        res.status(200).json(response);
      } catch (ex: unknown) {
        const error = isCustomError(ex) ?
          ex :
          new errors.UnknownError(undefined, { cause: ex as Error });

        switch (error.code) {
          case errors.TokenMismatch.code: {
            res.status(403).json({
              code: error.code,
              message: `Token mismatch for discriminator '${discriminator}'.`
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
            logger.error('An unknown error occured.', { ex: error });

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

export { renewLock };
