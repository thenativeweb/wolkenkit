import { Application } from '../../../../common/application/Application';
import { PerformReplay } from '../../../../common/domain/PerformReplay';
import { Schema } from '../../../../common/elements/Schema';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
declare const postPerformReplay: {
    description: string;
    path: string;
    request: {
        body: Schema;
    };
    response: {
        statusCodes: number[];
        body: Schema;
    };
    getHandler({ performReplay, application }: {
        performReplay: PerformReplay;
        application: Application;
    }): WolkenkitRequestHandler;
};
export { postPerformReplay };
