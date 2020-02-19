import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { getApplicationDescription } from '../../../../common/application/getApplicationDescription';
import { Request, RequestHandler, Response } from 'express';

const getDescription = function ({ applicationDefinition }: {
  applicationDefinition: ApplicationDefinition;
}): RequestHandler {
  const applicationDescription = getApplicationDescription({ applicationDefinition });

  return function (_req: Request, res: Response): void {
    res.send(applicationDescription.domainEvents);
  };
};

export { getDescription };
