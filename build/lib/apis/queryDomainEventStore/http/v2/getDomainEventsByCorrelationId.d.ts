import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { Schema } from '../../../../common/elements/Schema';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
declare const getDomainEventsByCorrelationId: {
    description: string;
    path: string;
    request: {
        query: Schema;
    };
    response: {
        statusCodes: number[];
        stream: boolean;
        body: Schema;
    };
    getHandler({ domainEventStore, heartbeatInterval }: {
        domainEventStore: DomainEventStore;
        heartbeatInterval: number;
    }): WolkenkitRequestHandler;
};
export { getDomainEventsByCorrelationId };
