import Application from '../../../../common/application/Application';
import { Request, RequestHandler, Response } from 'express-serve-static-core';

const getConfiguration = function ({ application }: {
  application: Application;
}): RequestHandler {
  const commands = application.commands.external;

  // Needs correct middleware types.
  return function (req: Request, res: Response): any {
    res.send(commands);
  };
};

export default getConfiguration;
