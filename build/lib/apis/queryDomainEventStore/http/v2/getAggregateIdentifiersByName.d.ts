import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { Schema } from '../../../../common/elements/Schema';
import { WolkenkitRequestHandler } from '../../../base/WolkenkitRequestHandler';
declare const getAggregateIdentifiersByName: {
    description: string;
    path: string;
    request: {
        query: Schema;
    };
    response: {
        statusCodes: number[];
        stream: boolean;
        body: import("get-graphql-from-jsonschema/build/lib/Types/TranslatableJsonSchema").TranslatableJsonSchema;
    };
    getHandler({ domainEventStore, heartbeatInterval }: {
        domainEventStore: DomainEventStore;
        heartbeatInterval: number;
    }): WolkenkitRequestHandler;
};
export { getAggregateIdentifiersByName };
