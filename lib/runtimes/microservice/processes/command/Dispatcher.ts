import { Client } from '../../../../apis/handleCommandWithMetadata/http/v2/Client';

export interface Dispatcher {
  client: Client;
  retries: number;
}
