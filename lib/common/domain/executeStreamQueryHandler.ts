import { Application } from '../application/Application';
import { ClientService } from '../services/ClientService';
import { errors } from '../errors';
import { flaschenpost } from 'flaschenpost';
import { getLoggerService } from '../services/getLoggerService';
import { LoggerService } from '../services/LoggerService';
import { QueryHandlerIdentifier } from '../elements/QueryHandlerIdentifier';
import { QueryOptions } from '../elements/QueryOptions';
import { validateQueryHandlerIdentifier } from '../validators/validateQueryHandlerIdentifier';
import { Value } from 'validate-value';
import { withLogMetadata } from '../utils/logging/withLogMetadata';
import { pipeline, Readable, Transform } from 'stream';

const logger = flaschenpost.getLogger();

const executeStreamQueryHandler = async function ({
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
}): Promise<Readable> {
  validateQueryHandlerIdentifier({ application, queryHandlerIdentifier });

  const queryHandler = application.views[queryHandlerIdentifier.view.name]!.queryHandlers[queryHandlerIdentifier.name]!;

  if (queryHandler.type !== 'stream') {
    throw new errors.QueryHandlerTypeMismatch();
  }

  const optionsSchema = new Value(queryHandler.getOptionsSchema ? queryHandler.getOptionsSchema() : {}),
        resultItemSchema = new Value(queryHandler.getResultItemSchema ? queryHandler.getResultItemSchema() : {});

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
  const resultStream = await queryHandler.handle(options, {
    client: services.client,
    infrastructure: application.infrastructure,
    logger: loggerService
  });

  const isAuthorizedServices = {
    client: services.client,
    logger: loggerService
  };
  const validateStream = new Transform({
    objectMode: true,
    transform (resultItem, encoding, callback): void {
      if (!queryHandler.isAuthorized(resultItem, isAuthorizedServices)) {
        return callback(null);
      }

      try {
        resultItemSchema.validate(resultItem, { valueName: 'resultItem' });
      } catch (ex: unknown) {
        const error = new errors.QueryResultInvalid((ex as Error).message);

        logger.warn(
          `An invalid item was omitted from a stream query handler's response.`,
          withLogMetadata('common', 'executeStreamQueryHandler', { err: error })
        );

        return callback(null);
      }

      return callback(null, resultItem);
    }
  });

  pipeline(
    resultStream,
    validateStream,
    (err): void => {
      if (err) {
        logger.error(
          'An error occured during stream piping.',
          withLogMetadata('common', 'executeStreamQueryHandler', { err })
        );
      }
    }
  );

  return validateStream;
};

export { executeStreamQueryHandler };
