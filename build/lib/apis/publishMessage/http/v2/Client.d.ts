import { HttpClient } from '../../../shared/HttpClient';
declare class Client extends HttpClient {
    constructor({ protocol, hostName, portOrSocket, path }: {
        protocol?: string;
        hostName: string;
        portOrSocket: number | string;
        path?: string;
    });
    postMessage({ channel, message }: {
        channel: string;
        message: object;
    }): Promise<void>;
}
export { Client };
