import { ClientMetadata } from '../utils/http/ClientMetadata';
import { ClientService } from './ClientService';
declare const getClientService: ({ clientMetadata }: {
    clientMetadata: ClientMetadata;
}) => ClientService;
export { getClientService };
