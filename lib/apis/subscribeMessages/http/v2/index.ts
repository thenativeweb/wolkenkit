import { Application } from 'express';
import { CorsOrigin } from 'get-cors-origin';
import { EventEmitter2 } from 'eventemitter2';
import { getApiBase } from '../../../base/getApiBase';
import { getMessages } from './getMessages';
import { PublishMessage } from '../../PublishMessage';

const getV2 = async function ({ corsOrigin, heartbeatInterval = 90_000 }: {
  corsOrigin: CorsOrigin;
  heartbeatInterval?: number;
}): Promise<{ api: Application; publishMessage: PublishMessage }> {
  const api = await getApiBase({
    request: {
      headers: { cors: { origin: corsOrigin }},
      body: { parser: false },
      query: { parser: { useJson: true }}
    },
    response: {
      headers: { cache: false }
    }
  });

  const messageEmitter = new EventEmitter2({
    wildcard: true
  });

  api.get(
    `/${getMessages.path}`,
    getMessages.getHandler({
      messageEmitter,
      heartbeatInterval
    })
  );

  const publishMessage: PublishMessage = function ({ channel, message }): void {
    messageEmitter.emit(channel, message);
  };

  return { api, publishMessage };
};

export { getV2 };
