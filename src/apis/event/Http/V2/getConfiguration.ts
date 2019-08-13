import Application from '../../../../common/application/Application';
import { Request, RequestHandler, Response } from 'express-serve-static-core';

const getConfiguration = function ({ application }: {
  application: Application;
}): RequestHandler {
  if (!application) {
    throw new Error('Application is missing.');
  }

  const events = application.events.external;

  return function (req: Request, res: Response): void {
    res.send(events);
  };
};

export default getConfiguration;
