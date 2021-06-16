import { Application } from '../../../../common/application/Application';
import { Schema } from '../../../../common/elements/Schema';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
declare const queryStream: {
    description: string;
    path: string;
    request: {
        query: Schema;
    };
    response: {
        statusCodes: number[];
    };
    getHandler({ application }: {
        application: Application;
    }): WolkenkitRequestHandler;
};
export { queryStream };
