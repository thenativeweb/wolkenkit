import { Application } from '../../../../common/application/Application';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { getAggregateIdentifierSchema } from '../../../../common/schemas/getAggregateIdentifierSchema';
import { getContextIdentifierSchema } from '../../../../common/schemas/getContextIdentifierSchema';
import { PerformReplay } from '../../PerformReplay';
import { Schema } from '../../../../common/elements/Schema';
import typer from 'content-type';
import { validateContextAndAggregateIdentifier } from '../../../../common/validators/validateContextAndAggregateIdentifier';
import { validateFlowNames } from '../../../../common/validators/validateFlowNames';
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
              contextIdentifier: getContextIdentifierSchema(),
              aggregateIdentifier: getAggregateIdentifierSchema(),
              from: { type: 'number', minimum: 1 },
              to: { type: 'number', minimum: 1 }
            },
            required: [ 'contextIdentifier', 'aggregateIdentifier', 'from', 'to' ]
          },
          minItems: 1
        }
      },
      required: [ 'aggregates' ],
      additionalProperties: false
    } as Schema
  },
  response: {
    statusCodes: [ 200, 400, 415 ],
    body: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false
    } as Schema
  },

  getHandler ({ performReplay, application }: {
    performReplay: PerformReplay;
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
        requestBodySchema.validate(req.body, { valueName: 'requestBody' });
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

      try {
        validateFlowNames({ flowNames, application });

        for (const aggregate of aggregates) {
          validateContextAndAggregateIdentifier({
            contextIdentifier: aggregate.contextIdentifier,
            aggregateIdentifier: aggregate.aggregateIdentifier,
            application
          });
        }
      } catch (ex) {
        res.status(400).json({
          code: ex.code,
          message: ex.message
        });

        return;
      }

      logger.info('Replay requested.', { flowNames, aggregates });

      try {
        await performReplay({ flowNames, aggregates });

        const response = {};

        responseBodySchema.validate(response, { valueName: 'responseBody' });

        res.status(200).json(response);
      } catch (ex) {
        logger.error('An unknown error occured.', { ex });

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
