import { AskInfrastructure } from './AskInfrastructure';
import { ClientService } from '../services/ClientService';
import { LoggerService } from '../services/LoggerService';
import { NotificationDefinition } from './NotificationDefinition';
import { GraphqlIncompatibleSchema } from './Schema';

export interface NotificationHandler<
  TNotificationDefinition extends NotificationDefinition,
  TInfrastructure extends AskInfrastructure
> {
  getDocumentation?: () => string;

  getDataSchema?: () => GraphqlIncompatibleSchema;

  getMetadataSchema?: () => GraphqlIncompatibleSchema;

  isAuthorized: (data: TNotificationDefinition['data'], metadata: TNotificationDefinition['metadata'], services: {
    client: ClientService;
    infrastructure: Pick<TInfrastructure, 'ask'>;
    logger: LoggerService;
  }) => boolean | Promise<boolean>;
}
