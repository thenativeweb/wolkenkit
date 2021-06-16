import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { HttpClient } from '../../../shared/HttpClient';
import { Snapshot } from '../../../../stores/domainEventStore/Snapshot';
import { State } from '../../../../common/elements/State';
declare class Client extends HttpClient {
    constructor({ protocol, hostName, portOrSocket, path }: {
        protocol?: string;
        hostName: string;
        portOrSocket: number | string;
        path?: string;
    });
    storeDomainEvents<TDomainEventData extends DomainEventData>({ domainEvents }: {
        domainEvents: DomainEvent<TDomainEventData>[];
    }): Promise<void>;
    storeSnapshot<TState extends State>({ snapshot }: {
        snapshot: Snapshot<TState>;
    }): Promise<void>;
}
export { Client };
