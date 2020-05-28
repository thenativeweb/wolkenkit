import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { getApplicationDescription } from '../../../../common/application/getApplicationDescription';
import { Value } from 'validate-value';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import { Request, Response } from 'express';

const getDescription = {
  description: `Returns a description of the application's domain events`,
  path: 'description',

  request: {},
  response: {
    statusCodes: [ 200 ],
    body: {}
  },

  getHandler ({ applicationDefinition }: {
    applicationDefinition: ApplicationDefinition;
  }): WolkenkitRequestHandler {
    const responseBodySchema = new Value(getDescription.response.body);

    const applicationDescription = getApplicationDescription({ applicationDefinition });

    return function (_req: Request, res: Response): void {
      const response = applicationDescription.domainEvents;

      responseBodySchema.validate(response);

      res.send(response);
    };
  }
};

export { getDescription };
