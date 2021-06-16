/// <reference types="node" />
import { HttpClient } from '../../../shared/HttpClient';
import { NotificationsDescription } from '../../../../common/application/NotificationsDescription';
import { PassThrough } from 'stream';
declare class Client extends HttpClient {
    constructor({ protocol, hostName, portOrSocket, path }: {
        protocol?: string;
        hostName: string;
        portOrSocket: number | string;
        path?: string;
    });
    getDescription(): Promise<NotificationsDescription>;
    getNotifications(): Promise<PassThrough>;
}
export { Client };
