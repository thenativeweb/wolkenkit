/// <reference types="node" />
import { DomainEventDescription } from '../../../../common/application/DomainEventDescription';
import { HttpClient } from '../../../shared/HttpClient';
import { PassThrough } from 'stream';
declare class Client extends HttpClient {
    constructor({ protocol, hostName, portOrSocket, path }: {
        protocol?: string;
        hostName: string;
        portOrSocket: number | string;
        path?: string;
    });
    getDescription(): Promise<Record<string, Record<string, Record<string, DomainEventDescription>>>>;
    getDomainEvents({ filter }: {
        filter?: Record<string, unknown>;
    }): Promise<PassThrough>;
}
export { Client };
