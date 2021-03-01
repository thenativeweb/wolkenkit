import { Application } from '../../../../common/application/Application';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { getAggregateIdentifierSchema } from '../../../../common/schemas/getAggregateIdentifierSchema';
import { isCustomError } from 'defekt';
import { PerformReplay } from '../../../../common/domain/PerformReplay';
import { Schema } from '../../../../common/elements/Schema';
import { validateAggregateIdentifier } from '../../../../common/validators/validateAggregateIdentifier';
import { validateContentType } from '../../../base/validateContentType';
import { validateFlowNames } from '../../../../common/validators/validateFlowNames';
import { Value } from 'validate-value';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
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
        validateContentType({
          expectedContentType: 'application/json',
          req
        });

        try {
          requestBodySchema.validate(req.body, { valueName: 'requestBody' });
        } catch (ex: unknown) {
          throw new errors.RequestMalformed((ex as Error).message);
        }

        const {
          flowNames = Object.keys(application.flows),
          aggregates
        } = req.body;

        validateFlowNames({ flowNames, application });

        for (const aggregate of aggregates) {
          validateAggregateIdentifier({
            aggregateIdentifier: aggregate.aggregateIdentifier,
            application
          });
        }

        logger.debug(
          'Received request for replay.',
          withLogMetadata('api', 'performReplay', { flowNames, aggregates })
        );

        await performReplay({ flowNames, aggregates });

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
          case errors.RequestMalformed.code:
          case errors.FlowNotFound.code:
          case errors.ContextNotFound.code:
          case errors.AggregateNotFound.code: {
            res.status(400).json({
              code: error.code,
              message: error.message
            });

            return;
          }
          default: {
            logger.error(
              'An unknown error occured.',
              withLogMetadata('api', 'performReplay', { error })
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

export { postPerformReplay };
