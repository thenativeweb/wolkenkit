import { Application } from '../../../../common/application/Application';
import { Configuration } from './Configuration';
import { IdentityProvider } from 'limes';
import { InitializeGraphQlOnServer } from '../../../../apis/graphql/InitializeGraphQlOnServer';
import { Notification } from '../../../../common/elements/Notification';
import { OnCancelCommand } from '../../../../apis/graphql/OnCancelCommand';
import { OnReceiveCommand } from '../../../../apis/handleCommand/OnReceiveCommand';
import { PublishDomainEvent } from '../../../../apis/observeDomainEvents/PublishDomainEvent';
import { Repository } from '../../../../common/domain/Repository';
import { Subscriber } from '../../../../messaging/pubSub/Subscriber';
import { Application as ExpressApplication } from 'express';
declare const getApi: ({ configuration, application, identityProviders, onReceiveCommand, onCancelCommand, repository, subscriber, channelForNotifications }: {
    configuration: Configuration;
    application: Application;
    identityProviders: IdentityProvider[];
    onReceiveCommand: OnReceiveCommand;
    onCancelCommand: OnCancelCommand;
    repository: Repository;
    subscriber: Subscriber<Notification>;
    channelForNotifications: string;
}) => Promise<{
    api: ExpressApplication;
    publishDomainEvent: PublishDomainEvent;
    initializeGraphQlOnServer: InitializeGraphQlOnServer | undefined;
}>;
export { getApi };
