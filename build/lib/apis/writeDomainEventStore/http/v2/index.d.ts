import { Application } from 'express';
import { CorsOrigin } from 'get-cors-origin';
import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
declare const getV2: ({ domainEventStore, corsOrigin }: {
    domainEventStore: DomainEventStore;
    corsOrigin: CorsOrigin;
    heartbeatInterval?: number | undefined;
}) => Promise<{
    api: Application;
}>;
export { getV2 };
