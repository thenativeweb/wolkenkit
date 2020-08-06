import { AskInfrastructure } from './AskInfrastructure';
import { ClientService } from '../services/ClientService';
import { LoggerService } from '../services/LoggerService';
import { NotificationDefinition } from './NotificationDefinition';
import { Schema } from './Schema';

export interface NotificationHandler<
  TNotificationDefinition extends NotificationDefinition,
  TInfrastructure extends AskInfrastructure
> {
  getDocumentation? (): string;

  getSchema? (): Schema;

  isAuthorized (data: Pick<TNotificationDefinition, 'data'>, metadata: Pick<TNotificationDefinition, 'metadata'>, services: {
    client: ClientService;
    infrastructure: Pick<TInfrastructure, 'ask'>;
    logger: LoggerService;
  }): boolean | Promise<boolean>;
}
