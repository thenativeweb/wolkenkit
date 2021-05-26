import { flaschenpost } from 'flaschenpost';
import { GraphqlIncompatibleSchema } from '../../../../common/elements/Schema';
import { isCustomError } from 'defekt';
import { OnReceiveMessage } from '../../OnReceiveMessage';
import { Parser } from 'validate-value';
import { validateContentType } from '../../../base/validateContentType';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import * as errors from '../../../../common/errors';

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
    } as GraphqlIncompatibleSchema
  },
  response: {
    statusCodes: [ 200, 415 ],
    body: { type: 'object' } as GraphqlIncompatibleSchema
  },

  getHandler ({ onReceiveMessage }: {
    onReceiveMessage: OnReceiveMessage;
  }): WolkenkitRequestHandler {
    const requestBodyParser = new Parser(postMessage.request.body),
          responseBodyParser = new Parser(postMessage.response.body);

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

        const { channel, message } = req.body;

        logger.debug(
          'Received message.',
          withLogMetadata('api', 'publishMessage', { channel, message })
        );

        await onReceiveMessage({ channel, message });

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
