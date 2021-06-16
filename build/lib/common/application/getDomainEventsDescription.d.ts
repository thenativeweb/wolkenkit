import { DomainDefinition } from './DomainDefinition';
import { DomainEventsDescription } from './DomainEventsDescription';
declare const getDomainEventsDescription: ({ domainDefinition }: {
    domainDefinition: DomainDefinition;
}) => DomainEventsDescription;
export { getDomainEventsDescription };
