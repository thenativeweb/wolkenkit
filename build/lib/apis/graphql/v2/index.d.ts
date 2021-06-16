import { Application } from '../../../common/application/Application';
import { CorsOrigin } from 'get-cors-origin';
import { Application as ExpressApplication } from 'express';
import { IdentityProvider } from 'limes';
import { InitializeGraphQlOnServer } from '../InitializeGraphQlOnServer';
import { Notification } from '../../../common/elements/Notification';
import { OnCancelCommand } from '../OnCancelCommand';
import { OnReceiveCommand } from '../OnReceiveCommand';
import { PublishDomainEvent } from '../PublishDomainEvent';
import { Repository } from '../../../common/domain/Repository';
import { Subscriber } from '../../../messaging/pubSub/Subscriber';
declare const getV2: ({ corsOrigin, application, identityProviders, handleCommand, observeDomainEvents, observeNotifications, queryView, enableIntegratedClient, webSocketEndpoint }: {
    corsOrigin: CorsOrigin;
    application: Application;
    identityProviders: IdentityProvider[];
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
    enableIntegratedClient: boolean;
    webSocketEndpoint?: string | undefined;
}) => Promise<{
    api: ExpressApplication;
    publishDomainEvent?: PublishDomainEvent | undefined;
    initializeGraphQlOnServer: InitializeGraphQlOnServer;
}>;
export { getV2 };
