import { CommandData } from '../../../../common/elements/CommandData';
import { CommandDescription } from '../../../../common/application/CommandDescription';
import { HttpClient } from '../../../shared/HttpClient';
import { ItemIdentifier } from '../../../../common/elements/ItemIdentifier';
declare class Client extends HttpClient {
    constructor({ protocol, hostName, portOrSocket, path }: {
        protocol?: string;
        hostName: string;
        portOrSocket: number | string;
        path?: string;
    });
    getDescription(): Promise<Record<string, Record<string, Record<string, CommandDescription>>>>;
    postCommand({ command }: {
        command: {
            aggregateIdentifier: {
                context: {
                    name: string;
                };
                aggregate: {
                    name: string;
                    id?: string;
                };
            };
            name: string;
            data: CommandData;
        };
    }): Promise<{
        id: string;
        aggregateIdentifier: {
            id: string;
        };
    }>;
    cancelCommand({ commandIdentifier }: {
        commandIdentifier: ItemIdentifier;
    }): Promise<void>;
}
export { Client };
