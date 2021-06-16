import { AskInfrastructure } from '../elements/AskInfrastructure';
import { CommandData } from '../elements/CommandData';
import { NotificationDefinition } from '../elements/NotificationDefinition';
import { NotificationSubscriber } from '../elements/NotificationSubscriber';
import { QueryHandlerReturnsStream } from '../elements/QueryHandlerReturnsStream';
import { QueryHandlerReturnsValue } from '../elements/QueryHandlerReturnsValue';
import { TellInfrastructure } from '../elements/TellInfrastructure';
interface ViewDefinition<TInfrastructure extends AskInfrastructure & TellInfrastructure = AskInfrastructure & TellInfrastructure, TQueries extends Record<string, CommandData> = Record<string, any>, TNotificationDefinitions extends Record<string, NotificationDefinition> = Record<string, any>> {
    queryHandlers: {
        [queryName in keyof TQueries]: QueryHandlerReturnsStream<TQueries[queryName], TInfrastructure> | QueryHandlerReturnsValue<TQueries[queryName], TInfrastructure>;
    };
    notificationSubscribers?: {
        [notificationName in keyof TNotificationDefinitions]: NotificationSubscriber<TNotificationDefinitions[notificationName], TInfrastructure>;
    };
}
export type { ViewDefinition };
