import { RootOptions } from '../../../RootOptions';
export interface ConsumerProgressMongoDbOptions extends RootOptions {
    'connection-string': string;
    'collection-name-progress': string;
}
