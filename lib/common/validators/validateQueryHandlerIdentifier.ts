import { Application } from '../application/Application';
import { QueryHandlerIdentifier } from '../elements/QueryHandlerIdentifier';
import * as errors from '../errors';

const validateQueryHandlerIdentifier = function ({
  queryHandlerIdentifier,
  application
}: {
  queryHandlerIdentifier: QueryHandlerIdentifier;
  application: Application;
}): void {
  const viewDefinitions = application.views;

  const {
    view: { name: viewName },
    name
  } = queryHandlerIdentifier;

  if (!(viewName in viewDefinitions)) {
    throw new errors.ViewNotFound(`View '${viewName}' not found.`);
  }
  if (!(name in viewDefinitions[viewName].queryHandlers)) {
    throw new errors.QueryHandlerNotFound(`Query handler '${viewName}.${name}' not found.`);
  }
};

export { validateQueryHandlerIdentifier };
