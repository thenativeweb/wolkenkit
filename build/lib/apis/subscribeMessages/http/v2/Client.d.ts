/// <reference types="node" />
import { HttpClient } from '../../../shared/HttpClient';
import { PassThrough } from 'stream';
declare class Client extends HttpClient {
    constructor({ protocol, hostName, portOrSocket, path }: {
        protocol?: string;
        hostName: string;
        portOrSocket: number | string;
        path?: string;
    });
    getMessages({ channel }: {
        channel: string;
    }): Promise<PassThrough>;
}
export { Client };
