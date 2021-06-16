import { AxiosInstance } from 'axios';
declare abstract class HttpClient {
    protected url: string;
    protected axios: AxiosInstance;
    constructor({ protocol, hostName, portOrSocket, path }: {
        protocol?: string;
        hostName: string;
        portOrSocket: number | string;
        path?: string;
    });
}
export { HttpClient };
