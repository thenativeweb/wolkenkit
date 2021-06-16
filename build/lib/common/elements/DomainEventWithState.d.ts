import { AggregateIdentifier } from './AggregateIdentifier';
import { DomainEvent } from './DomainEvent';
import { DomainEventData } from './DomainEventData';
import { DomainEventMetadata } from './DomainEventMetadata';
declare class DomainEventWithState<TDomainEventData extends DomainEventData, TState> extends DomainEvent<TDomainEventData> {
    readonly state: {
        previous: TState;
        next: TState;
    };
    constructor({ aggregateIdentifier, name, data, id, metadata, state }: {
        aggregateIdentifier: AggregateIdentifier;
        name: string;
        data: TDomainEventData;
        id: string;
        metadata: DomainEventMetadata;
        state: {
            previous: TState;
            next: TState;
        };
    });
    withoutState(): DomainEvent<TDomainEventData>;
}
export { DomainEventWithState };
