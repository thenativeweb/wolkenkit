import { Application } from '../../../../common/application/Application';
import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { Configuration } from './Configuration';
import { ItemIdentifier } from '../../../../common/elements/ItemIdentifier';
import { OnCancelCommand } from '../../../../apis/handleCommandWithMetadata/OnCancelCommand';
import { OnReceiveCommand } from '../../../../apis/handleCommand/OnReceiveCommand';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';
import { Subscriber } from '../../../../messaging/pubSub/Subscriber';
import { Application as ExpressApplication } from 'express';
declare const getApi: ({ configuration, application, priorityQueueStore, newCommandSubscriber, newCommandPubSubChannel, onReceiveCommand, onCancelCommand }: {
    configuration: Configuration;
    application: Application;
    priorityQueueStore: PriorityQueueStore<CommandWithMetadata<CommandData>, ItemIdentifier>;
    newCommandSubscriber: Subscriber<object>;
    newCommandPubSubChannel: string;
    onReceiveCommand: OnReceiveCommand;
    onCancelCommand: OnCancelCommand;
}) => Promise<{
    api: ExpressApplication;
}>;
export { getApi };
