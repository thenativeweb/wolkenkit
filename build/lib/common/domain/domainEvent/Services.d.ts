import { AggregatesService } from '../../services/AggregatesService';
import { AskInfrastructure } from '../../elements/AskInfrastructure';
import { ClientService } from '../../services/ClientService';
import { LoggerService } from '../../services/LoggerService';
export interface Services {
    aggregates: AggregatesService;
    client: ClientService;
    logger: LoggerService;
    infrastructure: AskInfrastructure;
}
