import { ClientMetadata } from '../../http/ClientMetadata';
import { QueryOptions } from '../../../elements/QueryOptions';
import { Readable } from 'stream';

export interface SandboxForView {
  query <TQueryOptions extends QueryOptions = QueryOptions>(parameters: {
    queryName: string;
    queryOptions?: TQueryOptions;
    client?: ClientMetadata;
  }): Promise<Readable>;
}
