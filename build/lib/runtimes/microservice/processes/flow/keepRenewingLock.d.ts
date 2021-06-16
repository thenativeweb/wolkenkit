import { DomainEventDispatcher } from './DomainEventDispatcher';
declare const keepRenewingLock: ({ flowName, flowPromise, domainEventDispatcher, token }: {
    flowName: string;
    flowPromise: Promise<any>;
    domainEventDispatcher: DomainEventDispatcher;
    token: string;
}) => Promise<void>;
export { keepRenewingLock };
