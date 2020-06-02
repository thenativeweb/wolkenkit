import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
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

  getHandler ({ applicationDefinition }: {
    applicationDefinition: ApplicationDefinition;
  }): WolkenkitRequestHandler {
    const responseBodySchema = new Value(getDescription.response.body);

    const applicationDescription = getApplicationDescription({ applicationDefinition });

    return function (_req, res): void {
      const response = applicationDescription.commands;

      console.log({ response });

      responseBodySchema.validate(response);

      res.send(response);
    };
  }
};

export { getDescription };
