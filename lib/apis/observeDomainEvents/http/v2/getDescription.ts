import { Application } from '../../../../common/application/Application';
import { flaschenpost } from 'flaschenpost';
import { getApplicationDescription } from '../../../../common/application/getApplicationDescription';
import { getDomainEventsDescriptionSchema } from '../../../../common/schemas/getDomainEventsDescriptionSchema';
import { Parser } from 'validate-value';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import { Request, Response } from 'express';
import * as errors from '../../../../common/errors';

const logger = flaschenpost.getLogger();

const getDescription = {
  description: `Returns a description of the application's domain events.`,
  path: 'description',

  request: {},
  response: {
    statusCodes: [ 200 ],
    body: getDomainEventsDescriptionSchema()
  },

  getHandler ({ application }: {
    application: Application;
  }): WolkenkitRequestHandler {
    const responseBodyParser = new Parser(getDescription.response.body);

    const applicationDescription = getApplicationDescription({ application });

    return function (req: Request, res: Response): void {
      try {
        const response = applicationDescription.domainEvents;

        responseBodyParser.parse(
          response,
          { valueName: 'responseBody' }
        ).unwrapOrThrow();

        res.send(response);
      } catch (ex: unknown) {
        const error = new errors.UnknownError({ cause: ex as Error });

        logger.error(
          'An unknown error occured.',
          withLogMetadata('api', 'observeDomainEvents', { error })
        );

        res.status(500).json({
          code: error.code,
          message: error.message
        });
      }
    };
  }
};

export { getDescription };
