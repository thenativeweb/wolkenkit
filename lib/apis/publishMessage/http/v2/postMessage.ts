import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { OnReceiveMessage } from '../../OnReceiveMessage';
import typer from 'content-type';
import { Value } from 'validate-value';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';

const logger = flaschenpost.getLogger();

const postMessage = {
  description: 'Publishes a message.',
  path: '',

  request: {
    body: {
      type: 'object',
      properties: {
        channel: { type: 'string' },
        message: { type: 'object' }
      },
      required: [ 'channel', 'message' ],
      additionalProperties: false
    }
  },
  response: {
    statusCodes: [ 200, 415 ],
    body: { type: 'object' }
  },

  getHandler ({ onReceiveMessage }: {
    onReceiveMessage: OnReceiveMessage;
  }): WolkenkitRequestHandler {
    const requestBodySchema = new Value(postMessage.request.body),
          responseBodySchema = new Value(postMessage.response.body);

    return async function (req, res): Promise<void> {
      let contentType: typer.ParsedMediaType;

      try {
        contentType = typer.parse(req);

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
        requestBodySchema.validate(req.body);
      } catch (ex) {
        const error = new errors.RequestMalformed(ex.message);

        res.status(400).json({
          code: error.code,
          message: error.message
        });

        return;
      }

      const { channel, message } = req.body;

      logger.info('Message received.', { channel });

      try {
        await onReceiveMessage({ channel, message });

        const response = {};

        responseBodySchema.validate(response);

        res.status(200).json(response);
      } catch {
        const ex = new errors.UnknownError();

        res.status(500).json({
          code: ex.code,
          message: ex.message
        });
      }
    };
  }
};

export { postMessage };
