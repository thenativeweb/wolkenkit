import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { Schema } from '../../../../common/elements/Schema';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
declare const getSnapshot: {
    description: string;
    path: string;
    request: {
        query: Schema;
    };
    response: {
        statusCodes: number[];
        body: Schema;
    };
    getHandler({ domainEventStore }: {
        domainEventStore: DomainEventStore;
    }): WolkenkitRequestHandler;
};
export { getSnapshot };
