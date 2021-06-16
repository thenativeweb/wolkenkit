/// <reference types="node" />
import { HttpClient } from '../../../shared/HttpClient';
import { Readable } from 'stream';
declare class Client extends HttpClient {
    constructor({ protocol, hostName, portOrSocket, path }: {
        protocol?: string;
        hostName: string;
        portOrSocket: number | string;
        path?: string;
    });
    getFile({ id }: {
        id: string;
    }): Promise<{
        id: string;
        name: string;
        contentType: string;
        stream: Readable;
    }>;
    addFile({ id, name, contentType, stream }: {
        id: string;
        name: string;
        contentType: string;
        stream: Readable;
    }): Promise<void>;
    removeFile({ id }: {
        id: string;
    }): Promise<void>;
}
export { Client };
