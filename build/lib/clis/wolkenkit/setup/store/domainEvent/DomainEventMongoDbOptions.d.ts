import { RootOptions } from '../../../RootOptions';
export interface DomainEventMongoDbOptions extends RootOptions {
    'connection-string': string;
    'collection-name-domain-events': string;
    'collection-name-snapshots': string;
}
