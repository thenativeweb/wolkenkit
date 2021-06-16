import { CommandsDescription } from './CommandsDescription';
import { DomainDefinition } from './DomainDefinition';
declare const getCommandsDescription: ({ domainDefinition }: {
    domainDefinition: DomainDefinition;
}) => CommandsDescription;
export { getCommandsDescription };
