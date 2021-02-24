import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { isCustomError } from 'defekt';
import { ItemIdentifier } from '../../../../common/elements/ItemIdentifier';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';
import { Schema } from '../../../../common/elements/Schema';
import { validateContentType } from '../../../base/validateContentType';
import { Value } from 'validate-value';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
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
        token: { type: 'string', format: 'uuid' }
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
        validateContentType({
          expectedContentType: 'application/json',
          req
        });

        try {
          requestBodySchema.validate(req.body, { valueName: 'requestBody' });
        } catch (ex: unknown) {
          throw new errors.RequestMalformed((ex as Error).message);
        }

        const { discriminator, token } = req.body;

        await priorityQueueStore.renewLock({
          discriminator,
          token
        });

        logger.info(
          'Renewed priority queue item lock.',
          withLogMetadata('api', 'awaitItem')
        );

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
              withLogMetadata('api', 'awaitItem', { err: ex })
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

export { renewLock };
