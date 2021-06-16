import { Client } from './Client';
import { ItemIdentifier } from './ItemIdentifier';
export interface ItemIdentifierWithClient extends ItemIdentifier {
    client: Client;
}
