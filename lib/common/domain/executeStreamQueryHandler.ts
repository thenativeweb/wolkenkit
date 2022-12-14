import { Application } from '../application/Application';
import { ClientService } from '../services/ClientService';
import { flaschenpost } from 'flaschenpost';
import { getLoggerService } from '../services/getLoggerService';
import { LoggerService } from '../services/LoggerService';
import { Parser } from 'validate-value';
import { QueryHandlerIdentifier } from '../elements/QueryHandlerIdentifier';
import { QueryOptions } from '../elements/QueryOptions';
import { validateQueryHandlerIdentifier } from '../validators/validateQueryHandlerIdentifier';
import { withLogMetadata } from '../utils/logging/withLogMetadata';
import { pipeline, Readable, Transform } from 'stream';
import * as errors from '../errors';

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

  const optionsParser = new Parser(queryHandler.getOptionsSchema ? queryHandler.getOptionsSchema() : {}),
        resultItemParser = new Parser(queryHandler.getResultItemSchema ? queryHandler.getResultItemSchema() : {});

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
    async transform (resultItem, encoding, callback): Promise<void> {
      const isAuthorized = await queryHandler.isAuthorized(resultItem, isAuthorizedServices);

      if (!isAuthorized) {
        return callback(null);
      }

      const parseResult = resultItemParser.parse(
        resultItem,
        { valueName: 'resultItem' }
      );

      if (parseResult.hasError()) {
        const error = new errors.QueryResultInvalid(parseResult.error.message);

        logger.warn(
          `An invalid item was omitted from a stream query handler's response.`,
          withLogMetadata('common', 'executeStreamQueryHandler', { error })
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
