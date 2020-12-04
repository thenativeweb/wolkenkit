import { AskInfrastructure } from '../elements/AskInfrastructure';
import { CommandData } from '../elements/CommandData';
import { NotificationDefinition } from '../elements/NotificationDefinition';
import { NotificationSubscriber } from '../elements/NotificationSubscriber';
import { QueryHandler } from '../elements/QueryHandler';
import { TellInfrastructure } from '../elements/TellInfrastructure';

interface ViewDefinition<
  TInfrastructure extends AskInfrastructure & TellInfrastructure = AskInfrastructure & TellInfrastructure,
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
}

export type {
  ViewDefinition
};
