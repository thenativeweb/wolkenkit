/// <reference types="node" />
import { ClientMetadata } from '../../http/ClientMetadata';
import { Notification } from '../../../elements/Notification';
import { QueryOptions } from '../../../elements/QueryOptions';
import { Readable } from 'stream';
export interface SandboxForView {
    query: <TQueryOptions extends QueryOptions = QueryOptions>(parameters: {
        queryName: string;
        queryOptions?: TQueryOptions;
        client?: ClientMetadata;
    }) => Promise<Readable>;
    notify: <TNotification extends Notification = Notification>(parameters: {
        notification: TNotification;
    }) => Promise<void>;
}
