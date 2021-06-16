import { AskInfrastructure, DomainEvent, DomainEventData, TellInfrastructure } from 'wolkenkit';
export interface Infrastructure extends AskInfrastructure, TellInfrastructure {
    ask: {
        viewStore: {
            domainEvents: DomainEvent<DomainEventData>[];
        };
    };
    tell: {
        viewStore: {
            domainEvents: DomainEvent<DomainEventData>[];
        };
    };
}
declare const _default: {
    getInfrastructure: () => Promise<any>;
    setupInfrastructure: () => Promise<void>;
};
export default _default;
