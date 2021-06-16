import { CorsOrigin } from 'get-cors-origin';
import { DomainEventStore } from '../../../stores/domainEventStore/DomainEventStore';
import { Application } from 'express';
declare const getApi: ({ domainEventStore, corsOrigin, heartbeatInterval }: {
    domainEventStore: DomainEventStore;
    corsOrigin: CorsOrigin;
    heartbeatInterval?: number | undefined;
}) => Promise<{
    api: Application;
}>;
export { getApi };
