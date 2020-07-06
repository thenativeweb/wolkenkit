import { Application } from '../application/Application';
import { errors } from '../errors';

const validateFlowNames = function ({ flowNames, application }: {
  flowNames: string[];
  application: Application;
}): void {
  for (const flowName of flowNames) {
    if (!(flowName in application.flows)) {
      throw new errors.FlowNotFound(`Flow '${flowName}' not found.`);
    }
  }
};

export { validateFlowNames };
