import { Application } from '../../../common/application/Application';
import { Notification } from '../../../common/elements/Notification';
import { OnCancelCommand } from '../OnCancelCommand';
import { OnReceiveCommand } from '../OnReceiveCommand';
import { PublishDomainEvent } from '../PublishDomainEvent';
import { Repository } from '../../../common/domain/Repository';
import { Subscriber } from '../../../messaging/pubSub/Subscriber';
import { GraphQLSchema } from 'graphql';
declare const getSchema: ({ application, handleCommand, observeDomainEvents, observeNotifications, queryView }: {
    application: Application;
    handleCommand: false | {
        onReceiveCommand: OnReceiveCommand;
        onCancelCommand: OnCancelCommand;
    };
    observeDomainEvents: false | {
        repository: Repository;
    };
    observeNotifications: false | {
        subscriber: Subscriber<Notification>;
        channelForNotifications: string;
    };
    queryView: boolean;
}) => Promise<{
    schema: GraphQLSchema;
    publishDomainEvent?: PublishDomainEvent | undefined;
}>;
export { getSchema };
