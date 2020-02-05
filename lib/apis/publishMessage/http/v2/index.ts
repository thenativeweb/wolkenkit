import { Application } from 'express';
import { CorsOrigin } from 'get-cors-origin';
import { getApiBase } from '../../../base/getApiBase';
import { OnReceiveMessage } from '../../OnReceiveMessage';
import { postMessage } from './postMessage';

const getV2 = async function ({ corsOrigin, onReceiveMessage }: {
  corsOrigin: CorsOrigin;
  onReceiveMessage: OnReceiveMessage;
}): Promise<{ api: Application }> {
  const api = await getApiBase({
    request: {
      headers: { cors: { origin: corsOrigin }},
      body: { parser: { sizeLimit: 100_000 }}
    },
    response: {
      headers: { cache: false }
    }
  });

  api.post('/', postMessage({ onReceiveMessage }));

  return { api };
};

export { getV2 };
