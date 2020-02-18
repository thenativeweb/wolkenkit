import { Configuration } from './Configuration';
import { getCorsOrigin } from 'get-cors-origin';
import { getApi as getPublishMessageApi } from '../../../../apis/publishMessage/http';
import { getApi as getSubscribeMessagesApi } from '../../../../apis/subscribeMessages/http';
import { OnReceiveMessage } from '../../../../apis/publishMessage/OnReceiveMessage';
import { PublishMessage } from '../../../../apis/subscribeMessages/PublishMessage';
import express, { Application } from 'express';

const getApi = async function ({ configuration, onReceiveMessage }: {
  configuration: Configuration;
  onReceiveMessage: OnReceiveMessage;
}): Promise<{ api: Application; publishMessage: PublishMessage }> {
  const { api: publishMessageApi } = await getPublishMessageApi({
    corsOrigin: getCorsOrigin(configuration.publishCorsOrigin),
    onReceiveMessage
  });

  const { api: subscribeMessagesApi, publishMessage } = await getSubscribeMessagesApi({
    corsOrigin: getCorsOrigin(configuration.subscribeCorsOrigin)
  });

  const api = express();

  api.use('/publish', publishMessageApi);
  api.use('/subscribe', subscribeMessagesApi);

  return { api, publishMessage };
};

export { getApi };
