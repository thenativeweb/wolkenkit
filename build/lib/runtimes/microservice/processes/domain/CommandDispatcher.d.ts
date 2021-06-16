import { Client } from '../../../../apis/awaitItem/http/v2/Client';
import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
export interface CommandDispatcher {
    client: Client<CommandWithMetadata<CommandData>>;
    renewalInterval: number;
    acknowledgeRetries: number;
}
