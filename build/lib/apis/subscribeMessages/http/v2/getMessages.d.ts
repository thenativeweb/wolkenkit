import { EventEmitter2 } from 'eventemitter2';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
declare const getMessages: {
    description: string;
    path: string;
    request: {};
    response: {
        statusCodes: number[];
        stream: boolean;
        body: {};
    };
    getHandler({ messageEmitter, heartbeatInterval }: {
        messageEmitter: EventEmitter2;
        heartbeatInterval: number;
    }): WolkenkitRequestHandler;
};
export { getMessages };
