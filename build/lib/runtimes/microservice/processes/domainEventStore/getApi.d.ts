import { Configuration } from './Configuration';
import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { Application } from 'express';
declare const getApi: ({ configuration, domainEventStore }: {
    configuration: Configuration;
    domainEventStore: DomainEventStore;
}) => Promise<{
    api: Application;
}>;
export { getApi };
