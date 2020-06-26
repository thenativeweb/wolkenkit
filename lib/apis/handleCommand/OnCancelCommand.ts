import { ItemIdentifierWithClient } from '../../common/elements/ItemIdentifierWithClient';

export type OnCancelCommand = ({ commandIdentifierWithClient }: {
  commandIdentifierWithClient: ItemIdentifierWithClient;
}) => Promise<void>;
