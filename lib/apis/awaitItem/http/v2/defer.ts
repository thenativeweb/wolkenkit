import { flaschenpost } from 'flaschenpost';
import { isCustomError } from 'defekt';
import { ItemIdentifier } from '../../../../common/elements/ItemIdentifier';
import { Parser } from 'validate-value';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';
import { Schema } from '../../../../common/elements/Schema';
import { validateContentType } from '../../../base/validateContentType';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import * as errors from '../../../../common/errors';

const logger = flaschenpost.getLogger();

const defer = {
  description: 'Defers an item from the queue.',
  path: 'defer',

  request: {
    body: {
      type: 'object',
      properties: {
        discriminator: { type: 'string', minLength: 1 },
        token: { type: 'string', format: 'uuid' },
        priority: { type: 'number', minimum: 0 }
      },
      required: [ 'discriminator', 'token', 'priority' ],
      additionalProperties: false
    } as Schema
  },
  response: {
    statusCodes: [ 200, 400, 403, 404, 415 ],
    body: { type: 'object' } as Schema
  },

  getHandler<TItem extends object> ({
    priorityQueueStore
  }: {
    priorityQueueStore: PriorityQueueStore<TItem, ItemIdentifier>;
  }): WolkenkitRequestHandler {
    const requestBodyParser = new Parser(defer.request.body),
          responseBodyParser = new Parser(defer.response.body);

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
          (err): Error => new errors.RequestMalformed(err.message)
        );

        const { discriminator, token, priority } = req.body;

        await priorityQueueStore.defer({
          discriminator,
          token,
          priority
        });

        logger.debug(
          'Deferred priority queue item.',
          withLogMetadata('api', 'awaitItem', { discriminator, priority })
        );

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
          case errors.RequestMalformed.code: {
            res.status(400).json({
              code: error.code,
              message: error.message
            });

            return;
          }
          case errors.TokenMismatch.code: {
            res.status(403).json({
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
              withLogMetadata('api', 'awaitItem', { error })
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

export { defer };
