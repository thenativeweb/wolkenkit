import { flaschenpost } from 'flaschenpost';
import { OnReceiveMessage } from '../../../../apis/publishMessage/OnReceiveMessage';
import { Publisher } from '../../../../messaging/pubSub/Publisher';

const logger = flaschenpost.getLogger();

const getOnReceiveMessage = function ({ publisher, pubSubChannel }: {
  publisher: Publisher<object>;
  pubSubChannel: string;
}): OnReceiveMessage {
  return async function ({ message }: {
    message: object;
  }): Promise<void> {
    logger.info('Received message.');

    await publisher.publish({
      channel: pubSubChannel,
      message
    });
  };
};

export { getOnReceiveMessage };
