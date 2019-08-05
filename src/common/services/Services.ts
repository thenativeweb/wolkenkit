import { ClientService } from './ClientService';
import { LoggerService } from './LoggerService';

export interface Services {
  app: Todo;
  client: ClientService;
  logger: LoggerService;
}
