import { DomainDefinition } from './DomainDefinition';
declare const getDomainDefinition: ({ domainDirectory }: {
    domainDirectory: string;
}) => Promise<DomainDefinition>;
export { getDomainDefinition };
