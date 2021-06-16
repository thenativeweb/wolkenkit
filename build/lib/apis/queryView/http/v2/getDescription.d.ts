import { Application } from '../../../../common/application/Application';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
declare const getDescription: {
    description: string;
    path: string;
    request: {};
    response: {
        statusCodes: number[];
        body: import("json-schema").JSONSchema7;
    };
    getHandler({ application }: {
        application: Application;
    }): WolkenkitRequestHandler;
};
export { getDescription };
