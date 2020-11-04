import { Application } from '../../../../common/application/Application';
import { getApplicationDescription } from '../../../../common/application/getApplicationDescription';
import { getCommandsDescriptionSchema } from '../../../../common/schemas/getCommandsDescriptionSchema';
import { Value } from 'validate-value';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';

const getDescription = {
  description: `Returns a description of the application's commands.`,
  path: 'description',

  request: {},
  response: {
    statusCodes: [ 200 ],
    body: getCommandsDescriptionSchema()
  },

  getHandler ({ application }: {
    application: Application;
  }): WolkenkitRequestHandler {
    const responseBodySchema = new Value(getDescription.response.body);

    const applicationDescription = getApplicationDescription({ application });

    return function (req, res): void {
      const response = applicationDescription.commands;

      responseBodySchema.validate(response, { valueName: 'responseBody' });

      res.send(response);
    };
  }
};

export { getDescription };
