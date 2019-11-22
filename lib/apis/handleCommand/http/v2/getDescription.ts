import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { getApplicationDescription } from '../../../../common/application/getApplicationDescription';
import { RequestHandler } from 'express';

const getDescription = function ({ applicationDefinition }: {
  applicationDefinition: ApplicationDefinition;
}): RequestHandler {
  const applicationDescription = getApplicationDescription({ applicationDefinition });

  return function (_req, res): void {
    res.send(applicationDescription.commands);
  };
};

export { getDescription };
