import { ClientMetadata } from '../../http/ClientMetadata';
import { executeQueryHandler } from '../../../domain/executeQueryHandler';
import { getClientService } from '../../../services/getClientService';
import { getLoggerService } from '../../../services/getLoggerService';
import { QueryOptions } from '../../../elements/QueryOptions';
import { Readable } from 'stream';
import { SandboxConfigurationForView } from './SandboxConfiguration';
import { SandboxForView } from './SandboxForView';

const createSandboxForView = function (sandboxConfiguration: SandboxConfigurationForView): SandboxForView {
  return {
    async query <TQueryOptions extends QueryOptions = QueryOptions>({ queryName, queryOptions, clientMetadata }: {
      queryName: string;
      queryOptions?: TQueryOptions;
      clientMetadata?: ClientMetadata;
    }): Promise<Readable> {
      const clientServiceFactory = sandboxConfiguration.clientServiceFactory ?? getClientService,
            loggerServiceFactory = sandboxConfiguration.loggerServiceFactory ?? getLoggerService;

      return await executeQueryHandler({
        application: sandboxConfiguration.application,
        queryHandlerIdentifier: {
          view: { name: sandboxConfiguration.viewName },
          name: queryName
        },
        services: {
          client: clientServiceFactory({ clientMetadata: clientMetadata ?? {
            ip: '127.0.0.1',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            token: '...'
          }}),
          logger: loggerServiceFactory({
            packageManifest: sandboxConfiguration.application.packageManifest,
            fileName: `<app>/server/views/${sandboxConfiguration.viewName}/queries/${queryName}`
          })
        },
        options: queryOptions ?? {}
      });
    }
  };
};

export { createSandboxForView };
