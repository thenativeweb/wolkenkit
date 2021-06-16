import { Application } from '../../../../common/application/Application';
import { OnCancelCommand } from '../../OnCancelCommand';
import { Schema } from '../../../../common/elements/Schema';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
declare const cancelCommand: {
    description: string;
    path: string;
    request: {
        body: import("get-graphql-from-jsonschema/build/lib/Types/TranslatableJsonSchema").TranslatableJsonSchema;
    };
    response: {
        statusCodes: number[];
        body: Schema;
    };
    getHandler({ onCancelCommand, application }: {
        onCancelCommand: OnCancelCommand;
        application: Application;
    }): WolkenkitRequestHandler;
};
export { cancelCommand };
