import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { HttpClient } from '../../../shared/HttpClient';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
declare class Client extends HttpClient {
    constructor({ protocol, hostName, portOrSocket, path }: {
        protocol?: string;
        hostName: string;
        portOrSocket: number | string;
        path?: string;
    });
    postCommand({ command }: {
        command: CommandWithMetadata<CommandData>;
    }): Promise<{
        id: string;
    }>;
    cancelCommand({ commandIdentifierWithClient }: {
        commandIdentifierWithClient: ItemIdentifierWithClient;
    }): Promise<void>;
}
export { Client };
