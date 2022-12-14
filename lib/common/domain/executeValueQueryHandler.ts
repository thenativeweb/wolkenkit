import { Application } from '../application/Application';
import { ClientService } from '../services/ClientService';
import { getErrorService } from '../services/getErrorService';
import { getLoggerService } from '../services/getLoggerService';
import { LoggerService } from '../services/LoggerService';
import { Parser } from 'validate-value';
import { QueryHandlerIdentifier } from '../elements/QueryHandlerIdentifier';
import { QueryOptions } from '../elements/QueryOptions';
import { QueryResultItem } from '../elements/QueryResultItem';
import { validateQueryHandlerIdentifier } from '../validators/validateQueryHandlerIdentifier';
import * as errors from '../errors';

const executeValueQueryHandler = async function ({
  application,
  queryHandlerIdentifier,
  options,
  services
}: {
  application: Application;
  queryHandlerIdentifier: QueryHandlerIdentifier;
  options: QueryOptions;
  services: {
    client: ClientService;
    logger?: LoggerService;
  };
}): Promise<QueryResultItem> {
  validateQueryHandlerIdentifier({ application, queryHandlerIdentifier });

  const queryHandler = application.views[queryHandlerIdentifier.view.name]!.queryHandlers[queryHandlerIdentifier.name]!;

  if (queryHandler.type !== 'value') {
    throw new errors.QueryHandlerTypeMismatch();
  }

  const optionsParser = new Parser(queryHandler.getOptionsSchema ? queryHandler.getOptionsSchema() : {}),
        resultParser = new Parser(queryHandler.getResultItemSchema ? queryHandler.getResultItemSchema() : {});

  optionsParser.parse(
    options,
    { valueName: 'queryHandlerOptions' }
  ).unwrapOrThrow(
    (err): Error => new errors.QueryOptionsInvalid(err.message)
  );

  const loggerService = services.logger ?? getLoggerService({
    fileName: `<app>/server/views/${queryHandlerIdentifier.view.name}/queryHandlers/${queryHandlerIdentifier.name}`,
    packageManifest: application.packageManifest
  });
  const result = await queryHandler.handle(options, {
    client: services.client,
    error: getErrorService({ errors: [ 'NotFound' ]}),
    infrastructure: application.infrastructure,
    logger: loggerService
  });

  const isAuthorizedServices = {
    client: services.client,
    logger: loggerService
  };

  const isAuthorized = await queryHandler.isAuthorized(result, isAuthorizedServices);

  if (!isAuthorized) {
    throw new errors.QueryNotAuthorized();
  }

  resultParser.parse(
    result,
    { valueName: 'result' }
  ).unwrapOrThrow(
    (err): Error => new errors.QueryResultInvalid(err.message)
  );

  return result;
};

export { executeValueQueryHandler };
