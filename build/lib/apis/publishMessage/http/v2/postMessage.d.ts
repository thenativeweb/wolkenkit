import { OnReceiveMessage } from '../../OnReceiveMessage';
import { Schema } from '../../../../common/elements/Schema';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
declare const postMessage: {
    description: string;
    path: string;
    request: {
        body: Schema;
    };
    response: {
        statusCodes: number[];
        body: Schema;
    };
    getHandler({ onReceiveMessage }: {
        onReceiveMessage: OnReceiveMessage;
    }): WolkenkitRequestHandler;
};
export { postMessage };
