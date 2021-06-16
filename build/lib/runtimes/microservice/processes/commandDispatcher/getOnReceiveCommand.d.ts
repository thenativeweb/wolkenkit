import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
import { OnReceiveCommand } from '../../../../apis/handleCommand/OnReceiveCommand';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';
import { Publisher } from '../../../../messaging/pubSub/Publisher';
declare const getOnReceiveCommand: ({ priorityQueueStore, newCommandPublisher, newCommandPubSubChannel }: {
    priorityQueueStore: PriorityQueueStore<CommandWithMetadata<CommandData>, ItemIdentifierWithClient>;
    newCommandPublisher: Publisher<object>;
    newCommandPubSubChannel: string;
}) => OnReceiveCommand;
export { getOnReceiveCommand };
