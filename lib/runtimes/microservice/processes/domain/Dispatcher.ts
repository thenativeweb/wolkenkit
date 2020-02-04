import { Client } from '../../../../apis/awaitCommandWithMetadata/http/v2/Client';

export interface Dispatcher {
  client: Client;
  renewalInterval: number;
  acknowledgeRetries: number;
}
