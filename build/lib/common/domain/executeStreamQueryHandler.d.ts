import { Application } from '../application/Application';
import { ClientService } from '../services/ClientService';
import { LoggerService } from '../services/LoggerService';
import { QueryHandlerIdentifier } from '../elements/QueryHandlerIdentifier';
import { QueryOptions } from '../elements/QueryOptions';
import { Readable } from 'stream';
declare const logger: import("flaschenpost/build/lib/Logger").Logger;
declare const executeStreamQueryHandler: ({ application, queryHandlerIdentifier, options, services }: {
    application: Application;
    queryHandlerIdentifier: QueryHandlerIdentifier;
    options: QueryOptions;
    services: {
        client: ClientService;
        logger?: LoggerService;
    };
}) => Promise<Readable>;
export { executeStreamQueryHandler };
