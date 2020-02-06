import { Application } from 'express';
import { CorsOrigin } from 'get-cors-origin';
import { getApiBase } from '../../../base/getApiBase';
import { getMessages } from './getMessages';
import { PublishMessage } from '../../PublishMessage';
import { SpecializedEventEmitter } from '../../../../common/utils/events/SpecializedEventEmitter';
import { streamNdjsonMiddleware } from '../../../middlewares/streamNdjson';

const getV2 = async function ({ corsOrigin, heartbeatInterval = 90_000 }: {
  corsOrigin: CorsOrigin;
  heartbeatInterval?: number;
}): Promise<{ api: Application; publishMessage: PublishMessage }> {
  const api = await getApiBase({
    request: {
      headers: { cors: { origin: corsOrigin }},
      body: { parser: false }
    },
    response: {
      headers: { cache: false }
    }
  });

  const messageEmitter = new SpecializedEventEmitter<object>();

  api.get(
    '/',
    streamNdjsonMiddleware({ heartbeatInterval }),
    getMessages({ messageEmitter })
  );

  const publishMessage: PublishMessage = function ({ message }): void {
    messageEmitter.emit(message);
  };

  return { api, publishMessage };
};

export { getV2 };
