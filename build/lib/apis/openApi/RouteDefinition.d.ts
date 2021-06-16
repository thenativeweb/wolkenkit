import { Schema } from '../../common/elements/Schema';
export interface RouteDefinition {
    description: string;
    path: string;
    request: {
        headers?: Schema;
        body?: Schema;
        query?: Schema;
    };
    response: {
        statusCodes: number[];
        stream?: boolean;
        headers?: Schema;
        body?: Schema;
    };
}
