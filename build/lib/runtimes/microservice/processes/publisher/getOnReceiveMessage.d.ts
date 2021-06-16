import { OnReceiveMessage } from '../../../../apis/publishMessage/OnReceiveMessage';
import { Publisher } from '../../../../messaging/pubSub/Publisher';
declare const getOnReceiveMessage: ({ publisher }: {
    publisher: Publisher<object>;
}) => OnReceiveMessage;
export { getOnReceiveMessage };
