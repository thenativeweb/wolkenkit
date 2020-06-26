import { ClientMetadata } from '../../utils/http/ClientMetadata';
import { ClientService } from '../ClientService';

export type GetClientService = (parameters: {
  clientMetadata: ClientMetadata;
}) => ClientService;
