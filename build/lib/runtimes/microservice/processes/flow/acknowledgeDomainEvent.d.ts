import { DomainEventDispatcher } from './DomainEventDispatcher';
declare const acknowledgeDomainEvent: ({ flowName, token, domainEventDispatcher }: {
    flowName: string;
    token: string;
    domainEventDispatcher: DomainEventDispatcher;
}) => Promise<void>;
export { acknowledgeDomainEvent };
