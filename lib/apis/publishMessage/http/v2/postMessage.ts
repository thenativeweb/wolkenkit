import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { isCustomError } from 'defekt';
import { OnReceiveMessage } from '../../OnReceiveMessage';
import { Schema } from '../../../../common/elements/Schema';
import { validateContentType } from '../../../base/validateContentType';
import { Value } from 'validate-value';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';

const logger = flaschenpost.getLogger();

const postMessage = {
  description: 'Publishes a message.',
  path: '',

  request: {
    body: {
      type: 'object',
      properties: {
        channel: { type: 'string', minLength: 1 },
        message: { type: 'object' }
      },
      required: [ 'channel', 'message' ],
      additionalProperties: false
    } as Schema
  },
  response: {
    statusCodes: [ 200, 415 ],
    body: { type: 'object' } as Schema
  },

  getHandler ({ onReceiveMessage }: {
    onReceiveMessage: OnReceiveMessage;
  }): WolkenkitRequestHandler {
    const requestBodySchema = new Value(postMessage.request.body),
          responseBodySchema = new Value(postMessage.response.body);

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

        const { channel, message } = req.body;

        logger.debug(
          'Received message.',
          withLogMetadata('api', 'publishMessage', { channel, message })
        );

        await onReceiveMessage({ channel, message });

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
          default: {
            logger.error(
              'An unknown error occured.',
              withLogMetadata('api', 'publishMessage', { error })
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

export { postMessage };
