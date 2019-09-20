import { Request, RequestHandler, Response } from 'express-serve-static-core';

const getHealth = function ({ processId }: {
  processId: string;
}): RequestHandler {
  if (!processId) {
    throw new Error('Process id is missing.');
  }

  return function (req: Request, res: Response): void {
    res.json({ processId });
  };
};

export default getHealth;
