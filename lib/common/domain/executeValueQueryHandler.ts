import { Application } from '../application/Application';
import { ClientService } from '../services/ClientService';
import { errors } from '../errors';
import { getErrorService } from '../services/getErrorService';
import { getLoggerService } from '../services/getLoggerService';
import { LoggerService } from '../services/LoggerService';
import { QueryHandlerIdentifier } from '../elements/QueryHandlerIdentifier';
import { QueryOptions } from '../elements/QueryOptions';
import { QueryResultItem } from '../elements/QueryResultItem';
import { validateQueryHandlerIdentifier } from '../validators/validateQueryHandlerIdentifier';
import { Value } from 'validate-value';

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

  const optionsSchema = new Value(queryHandler.getOptionsSchema ? queryHandler.getOptionsSchema() : {}),
        resultSchema = new Value(queryHandler.getResultItemSchema ? queryHandler.getResultItemSchema() : {});

  try {
    optionsSchema.validate(options, { valueName: 'queryHandlerOptions' });
  } catch (ex: unknown) {
    throw new errors.QueryOptionsInvalid((ex as Error).message);
  }

  const loggerService = services.logger ?? getLoggerService({
    fileName: `<app>/server/views/${queryHandlerIdentifier.view.name}/queryHandlers/${queryHandlerIdentifier.name}`,
    packageManifest: application.packageManifest
  });
  // eslint-disable-next-line @typescript-eslint/await-thenable
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

  if (!queryHandler.isAuthorized(result, isAuthorizedServices)) {
    throw new errors.QueryNotAuthorized();
  }

  try {
    resultSchema.validate(result, { valueName: 'result' });
  } catch (ex: unknown) {
    throw new errors.QueryResultInvalid((ex as Error).message);
  }

  return result;
};

export { executeValueQueryHandler };
