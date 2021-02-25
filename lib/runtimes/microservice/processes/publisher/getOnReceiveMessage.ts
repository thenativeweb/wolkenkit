import { flaschenpost } from 'flaschenpost';
import { OnReceiveMessage } from '../../../../apis/publishMessage/OnReceiveMessage';
import { Publisher } from '../../../../messaging/pubSub/Publisher';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';

const logger = flaschenpost.getLogger();

const getOnReceiveMessage = function ({ publisher }: {
  publisher: Publisher<object>;
}): OnReceiveMessage {
  return async function ({ channel, message }: {
    channel: string;
    message: object;
  }): Promise<void> {
    logger.debug(
      'Received message.',
      withLogMetadata('runtime', 'microservice/publisher', { channel, message })
    );

    await publisher.publish({
      channel,
      message
    });
  };
};

export { getOnReceiveMessage };
