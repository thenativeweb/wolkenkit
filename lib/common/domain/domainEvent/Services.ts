import { AggregatesService } from '../../services/AggregatesService';
import { ClientService } from '../../services/ClientService';
import { LoggerService } from '../../services/LoggerService';

export interface Services {
  aggregates: AggregatesService;
  client: ClientService;
  logger: LoggerService;
}
