import { Application } from '../../../../common/application/Application';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { getAggregateIdentifierSchema } from '../../../../common/schemas/getAggregateIdentifierSchema';
import { OnPerformReplay } from '../../OnPerformReplay';
import { Schema } from '../../../../common/elements/Schema';
import typer from 'content-type';
import { Value } from 'validate-value';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';

const logger = flaschenpost.getLogger();

const postPerformReplay = {
  description: 'Performs a replay.',
  path: '',

  request: {
    body: {
      type: 'object',
      properties: {
        flowNames: {
          type: 'array',
          items: { type: 'string', minLength: 1 },
          minItems: 1
        },
        aggregates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              aggregateIdentifier: getAggregateIdentifierSchema(),
              from: { type: 'number', minimum: 1 },
              to: { type: 'number', minimum: 1 }
            },
            required: [ 'aggregateIdentifier', 'from', 'to' ]
          },
          minItems: 1
        }
      },
      required: [ 'aggregates' ],
      additionalProperties: false
    } as Schema
  },
  response: {
    statusCodes: [ 200, 400, 404, 415 ],
    body: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false
    } as Schema
  },

  getHandler ({ onPerformReplay, application }: {
    onPerformReplay: OnPerformReplay;
    application: Application;
  }): WolkenkitRequestHandler {
    const requestBodySchema = new Value(postPerformReplay.request.body),
          responseBodySchema = new Value(postPerformReplay.response.body);

    return async function (req, res): Promise<void> {
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
        requestBodySchema.validate(req.body);
      } catch (ex) {
        const error = new errors.RequestMalformed(ex.message);

        res.status(400).json({
          code: error.code,
          message: error.message
        });

        return;
      }

      const {
        flowNames = Object.keys(application.flows),
        aggregates
      } = req.body;

      for (const flowName of flowNames) {
        if (!(flowName in application.flows)) {
          const error = new errors.FlowNotFound(`Flow '${flowName}' not found.`);

          res.status(404).json({
            code: error.code,
            message: error.message
          });

          return;
        }
      }

      logger.info('Replay requested.', { flowNames, aggregates });

      try {
        await onPerformReplay({ flowNames, aggregates });

        const response = {};

        responseBodySchema.validate(response);

        res.status(200).json(response);
      } catch (ex) {
        logger.error('Unknown error occured.', { ex });

        const error = new errors.UnknownError();

        res.status(500).json({
          code: error.code,
          message: error.message
        });
      }
    };
  }
};

export { postPerformReplay };
