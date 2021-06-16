import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
declare const getHealth: {
    description: string;
    path: string;
    request: {};
    response: {
        statusCode: number[];
        body: {
            type: string;
            properties: {
                host: {
                    type: string;
                    properties: {
                        architecture: {
                            type: string;
                            minLength: number;
                        };
                        platform: {
                            type: string;
                            minLength: number;
                        };
                    };
                    required: string[];
                    additionalProperties: boolean;
                };
                node: {
                    type: string;
                    properties: {
                        version: {
                            type: string;
                            minLength: number;
                        };
                    };
                    required: string[];
                    additionalProperties: boolean;
                };
                process: {
                    type: string;
                    properties: {
                        id: {
                            type: string;
                        };
                        uptime: {
                            type: string;
                        };
                    };
                    required: string[];
                    additionalProperties: boolean;
                };
                cpuUsage: {
                    type: string;
                    properties: {
                        user: {
                            type: string;
                        };
                        system: {
                            type: string;
                        };
                    };
                    required: string[];
                    additionalProperties: boolean;
                };
                memoryUsage: {
                    type: string;
                    properties: {
                        rss: {
                            type: string;
                        };
                        maxRss: {
                            type: string;
                        };
                        heapTotal: {
                            type: string;
                        };
                        heapUsed: {
                            type: string;
                        };
                        external: {
                            type: string;
                        };
                    };
                    required: string[];
                    additionalProperties: boolean;
                };
                diskUsage: {
                    type: string;
                    properties: {
                        read: {
                            type: string;
                        };
                        write: {
                            type: string;
                        };
                    };
                    required: string[];
                    additionalProperties: boolean;
                };
            };
            required: string[];
            additionalProperties: boolean;
        };
    };
    getHandler(): WolkenkitRequestHandler;
};
export { getHealth };
