import { Application } from '../../../../common/application/Application';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { getApplicationDescription } from '../../../../common/application/getApplicationDescription';
import { getDomainEventsDescriptionSchema } from '../../../../common/schemas/getDomainEventsDescriptionSchema';
import { Value } from 'validate-value';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import { Request, Response } from 'express';

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
    const responseBodySchema = new Value(getDescription.response.body);

    const applicationDescription = getApplicationDescription({ application });

    return function (req: Request, res: Response): void {
      try {
        const response = applicationDescription.domainEvents;

        responseBodySchema.validate(response, { valueName: 'responseBody' });

        res.send(response);
      } catch (ex: unknown) {
        const error = new errors.UnknownError(undefined, { cause: ex as Error });

        logger.error(
          'An unknown error occured.',
          withLogMetadata('api', 'observeDomainEvents', { err: ex })
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
