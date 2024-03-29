import { Application } from '../../../../common/application/Application';
import { getApplicationDescription } from '../../../../common/application/getApplicationDescription';
import { getNotificationsDescriptionSchema } from '../../../../common/schemas/getNotificationsDescriptionSchema';
import { Parser } from 'validate-value';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
import { Request, Response } from 'express';

const getDescription = {
  description: `Returns a description of the application's notifications.`,
  path: 'description',

  request: {},
  response: {
    statusCodes: [ 200 ],
    body: getNotificationsDescriptionSchema()
  },

  getHandler ({ application }: {
    application: Application;
  }): WolkenkitRequestHandler {
    const responseBodyParser = new Parser(getDescription.response.body);

    const applicationDescription = getApplicationDescription({ application });

    return function (req: Request, res: Response): void {
      const response = applicationDescription.notifications;

      responseBodyParser.parse(
        response,
        { valueName: 'responseBody' }
      ).unwrapOrThrow();

      res.send(response);
    };
  }
};

export { getDescription };
