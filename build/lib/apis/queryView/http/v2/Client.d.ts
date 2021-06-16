/// <reference types="node" />
import { HttpClient } from '../../../shared/HttpClient';
import { QueryDescription } from '../../../../common/application/QueryDescription';
import { QueryResultItem } from '../../../../common/elements/QueryResultItem';
import { PassThrough } from 'stream';
declare class Client extends HttpClient {
    constructor({ protocol, hostName, portOrSocket, path }: {
        protocol?: string;
        hostName: string;
        portOrSocket: number | string;
        path?: string;
    });
    getDescription(): Promise<Record<string, Record<string, QueryDescription>>>;
    queryStream({ viewName, queryName, queryOptions }: {
        viewName: string;
        queryName: string;
        queryOptions?: Record<string, unknown>;
    }): Promise<PassThrough>;
    queryValue({ viewName, queryName, queryOptions }: {
        viewName: string;
        queryName: string;
        queryOptions?: Record<string, unknown>;
    }): Promise<QueryResultItem>;
}
export { Client };
