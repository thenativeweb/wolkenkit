import { AskInfrastructure } from './AskInfrastructure';
import { CommandData } from './CommandData';
import { NotificationDefinition } from './NotificationDefinition';
import { NotificationSubscriber } from './NotificationSubscriber';
import { QueryHandler } from './QueryHandler';
import { TellInfrastructure } from './TellInfrastructure';
import { ViewEnhancer } from '../../tools/ViewEnhancer';

export interface View<
  TInfrastructure extends AskInfrastructure & TellInfrastructure,
  TQueries extends Record<string, CommandData> = Record<string, any>,
  TNotificationDefinitions extends Record<string, NotificationDefinition> = Record<string, any>
> {
  queryHandlers: {
    [queryName in keyof TQueries]: QueryHandler<
    TQueries[queryName],
    TInfrastructure
    >
  };

  notificationSubscribers?: {
    [notificationName in keyof TNotificationDefinitions]: NotificationSubscriber<
    TNotificationDefinitions[notificationName],
    TInfrastructure
    >
  };

  enhancers?: ViewEnhancer[];
}
