import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { OnReceiveMessage } from '../../OnReceiveMessage';
import { Schema } from '../../../../common/elements/Schema';
import typer from 'content-type';
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
        const contentType = typer.parse(req);

        if (contentType.type !== 'application/json') {
          throw new errors.ContentTypeMismatch();
        }
      } catch {
        const ex = new errors.ContentTypeMismatch('Header content-type must be application/json.');

        res.status(415).json({
          code: ex.code,
          message: ex.message
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

      const { channel, message } = req.body;

      logger.info(
        'Received message.',
        withLogMetadata('api', 'publishMessage', { channel })
      );

      try {
        await onReceiveMessage({ channel, message });

        const response = {};

        responseBodySchema.validate(response, { valueName: 'responseBody' });

        res.status(200).json(response);
      } catch (ex) {
        logger.error(
          'An unknown error occured.',
          withLogMetadata('api', 'publishMessage', { err: ex })
        );

        const error = new errors.UnknownError();

        res.status(500).json({
          code: error.code,
          message: error.message
        });
      }
    };
  }
};

export { postMessage };
