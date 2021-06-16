import { Application } from '../application/Application';
import { ClientService } from '../services/ClientService';
import { LoggerService } from '../services/LoggerService';
import { QueryHandlerIdentifier } from '../elements/QueryHandlerIdentifier';
import { QueryOptions } from '../elements/QueryOptions';
import { QueryResultItem } from '../elements/QueryResultItem';
declare const executeValueQueryHandler: ({ application, queryHandlerIdentifier, options, services }: {
    application: Application;
    queryHandlerIdentifier: QueryHandlerIdentifier;
    options: QueryOptions;
    services: {
        client: ClientService;
        logger?: LoggerService;
    };
}) => Promise<QueryResultItem>;
export { executeValueQueryHandler };
