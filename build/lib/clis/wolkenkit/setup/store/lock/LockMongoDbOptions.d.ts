import { RootOptions } from '../../../RootOptions';
export interface LockMongoDbOptions extends RootOptions {
    'connection-string': string;
    'collection-name-locks': string;
}
