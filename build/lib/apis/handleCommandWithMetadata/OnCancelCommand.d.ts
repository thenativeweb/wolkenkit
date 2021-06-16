import { ItemIdentifierWithClient } from '../../common/elements/ItemIdentifierWithClient';
export declare type OnCancelCommand = ({ commandIdentifierWithClient }: {
    commandIdentifierWithClient: ItemIdentifierWithClient;
}) => Promise<void>;
