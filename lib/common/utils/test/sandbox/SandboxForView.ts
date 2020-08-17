import { ClientMetadata } from '../../http/ClientMetadata';
import { Notification } from '../../../elements/Notification';
import { QueryOptions } from '../../../elements/QueryOptions';
import { Readable } from 'stream';

export interface SandboxForView {
  query <TQueryOptions extends QueryOptions = QueryOptions>({ queryName, queryOptions, client }: {
    queryName: string;
    queryOptions?: TQueryOptions;
    client?: ClientMetadata;
  }): Promise<Readable>;

  notify <TNotification extends Notification = Notification>({ notification }: {
    notification: TNotification;
  }): Promise<void>;
}
