import { AggregateIdentifier } from '../../../../common/elements/AggregateIdentifier';
import { HttpClient } from '../../../shared/HttpClient';
declare class Client extends HttpClient {
    constructor({ protocol, hostName, portOrSocket, path }: {
        protocol?: string;
        hostName: string;
        portOrSocket: number | string;
        path?: string;
    });
    performReplay({ flowNames, aggregates }: {
        flowNames?: string[];
        aggregates: {
            aggregateIdentifier: AggregateIdentifier;
            from: number;
            to: number;
        }[];
    }): Promise<void>;
}
export { Client };
