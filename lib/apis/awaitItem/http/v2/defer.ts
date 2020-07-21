import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { ItemIdentifier } from '../../../../common/elements/ItemIdentifier';
import { jsonSchema } from 'uuidv4';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';
import typer from 'content-type';
import { Value } from 'validate-value';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';

const logger = flaschenpost.getLogger();

const defer = {
  description: 'Defers an item from the queue.',
  path: 'defer',

  request: {
    body: {
      type: 'object',
      properties: {
        discriminator: { type: 'string', minLength: 1 },
        token: jsonSchema.v4,
        priority: { type: 'number', minimum: 0 }
      },
      required: [ 'discriminator', 'token', 'priority' ],
      additionalProperties: false
    }
  },
  response: {
    statusCodes: [ 200, 400, 403, 404, 415 ],
    body: { type: 'object' }
  },

  getHandler<TItem> ({
    priorityQueueStore
  }: {
    priorityQueueStore: PriorityQueueStore<TItem, ItemIdentifier>;
  }): WolkenkitRequestHandler {
    const requestBodySchema = new Value(defer.request.body),
          responseBodySchema = new Value(defer.response.body);

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
      } catch (ex) {
        const error = new errors.RequestMalformed(ex.message);

        res.status(400).json({
          code: error.code,
          message: error.message
        });

        return;
      }

      const { discriminator, token, priority } = req.body;

      try {
        await priorityQueueStore.defer({
          discriminator,
          token,
          priority
        });

        logger.info('Deferred priority queue item.', { discriminator, priority });

        const response = {};

        responseBodySchema.validate(response, { valueName: 'responseBody' });

        res.status(200).json(response);
      } catch (ex) {
        switch (ex.code) {
          case errors.TokenMismatch.code: {
            res.status(403).json({
              code: ex.code,
              message: `Token mismatch for discriminator '${discriminator}'.`
            });

            return;
          }
          case errors.ItemNotFound.code: {
            res.status(404).json({
              code: ex.code,
              message: ex.message
            });

            return;
          }
          default: {
            logger.error('An unknown error occured.', { ex });

            res.status(500).json({
              code: ex.code ?? errors.UnknownError.code,
              message: ex.message
            });
          }
        }
      }
    };
  }
};

export { defer };
