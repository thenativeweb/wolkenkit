import { Client } from '../../../../apis/handleCommandWithMetadata/http/v2/Client';
export interface CommandDispatcher {
    client: Client;
    retries: number;
}
