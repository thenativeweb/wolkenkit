import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { HttpClient } from '../../../shared/HttpClient';
declare class Client extends HttpClient {
    constructor({ protocol, hostName, portOrSocket, path }: {
        protocol?: string;
        hostName: string;
        portOrSocket: number | string;
        path?: string;
    });
    postDomainEvent({ flowNames, domainEvent }: {
        flowNames?: string[];
        domainEvent: DomainEvent<DomainEventData>;
    }): Promise<void>;
}
export { Client };
