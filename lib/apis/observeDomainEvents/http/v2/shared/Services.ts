import { AggregatesService } from '../../../../../common/services/AggregatesService';
import { ClientService } from '../../../../../common/services/ClientService';
import { LoggerService } from '../../../../../common/services/LoggerService';

export interface Services {
  aggregates: AggregatesService;
  client: ClientService;
  logger: LoggerService;
}
