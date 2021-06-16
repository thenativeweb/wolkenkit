import { HttpClient } from '../../../shared/HttpClient';
declare class Client extends HttpClient {
    constructor({ protocol, hostName, portOrSocket, path }: {
        protocol?: string;
        hostName: string;
        portOrSocket: number | string;
        path?: string;
    });
    getHealth(): Promise<{
        host: {
            architecture: string;
            platform: string;
        };
        node: {
            version: string;
        };
        process: {
            id: number;
            uptime: number;
        };
        cpuUsage: {
            user: number;
            system: number;
        };
        memoryUsage: {
            rss: number;
            maxRss: number;
            heapTotal: number;
            heapUsed: number;
            external: number;
        };
        diskUsage: {
            read: number;
            write: number;
        };
    }>;
}
export { Client };
