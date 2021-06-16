import { ClientMetadata } from '../../utils/http/ClientMetadata';
import { ClientService } from '../ClientService';
export declare type GetClientService = (parameters: {
    clientMetadata: ClientMetadata;
}) => ClientService;
