import { Application } from '../../../../common/application/Application';
import { getApplicationDescription } from '../../../../common/application/getApplicationDescription';
import { getViewsDescriptionSchema } from '../../../../common/schemas/getViewsDescriptionSchema';
import { Value } from 'validate-value';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';

const getDescription = {
  description: `Returns a description of the application's views.`,
  path: 'description',

  request: {},
  response: {
    statusCodes: [ 200 ],
    body: getViewsDescriptionSchema()
  },

  getHandler ({ application }: {
    application: Application;
  }): WolkenkitRequestHandler {
    const responseBodySchema = new Value(getDescription.response.body);

    const applicationDescription = getApplicationDescription({ application });

    return function (req, res): void {
      const response = applicationDescription.views;

      responseBodySchema.validate(response, { valueName: 'responseBody' });

      res.send(response);
    };
  }
};

export { getDescription };
