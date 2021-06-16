import { Application } from '../../../../common/application/Application';
import { OnReceiveCommand } from '../../OnReceiveCommand';
import { Schema } from '../../../../common/elements/Schema';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
declare const postCommand: {
    description: string;
    path: string;
    request: {
        body: Schema;
    };
    response: {
        statusCodes: number[];
        body: Schema;
    };
    getHandler({ onReceiveCommand, application }: {
        onReceiveCommand: OnReceiveCommand;
        application: Application;
    }): WolkenkitRequestHandler;
};
export { postCommand };
