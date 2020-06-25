import { Client } from '../../../../apis/awaitItem/http/v2/Client';
import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { ItemIdentifier } from '../../../../common/elements/ItemIdentifier';

export interface CommandDispatcher {
  client: Client<CommandWithMetadata<CommandData>, ItemIdentifier>;
  renewalInterval: number;
  acknowledgeRetries: number;
}
