import { Application } from '../../../../common/application/Application';
import { OnReceiveDomainEvent } from '../../OnReceiveDomainEvent';
import { Schema } from '../../../../common/elements/Schema';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
declare const postDomainEvent: {
    description: string;
    path: string;
    request: {
        body: Schema;
    };
    response: {
        statusCodes: number[];
        body: Schema;
    };
    getHandler({ onReceiveDomainEvent, application }: {
        onReceiveDomainEvent: OnReceiveDomainEvent;
        application: Application;
    }): WolkenkitRequestHandler;
};
export { postDomainEvent };
