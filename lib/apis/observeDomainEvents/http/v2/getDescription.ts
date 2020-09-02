import { Application } from '../../../../common/application/Application';
import { getApplicationDescription } from '../../../../common/application/getApplicationDescription';
import { getDomainEventsDescriptionSchema } from '../../../../common/schemas/getDomainEventsDescriptionSchema';
import { Value } from 'validate-value';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import { Request, Response } from 'express';

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

    return function (_req: Request, res: Response): void {
      const response = applicationDescription.domainEvents;

      responseBodySchema.validate(response, { valueName: 'responseBody' });

      res.send(response);
    };
  }
};

export { getDescription };
