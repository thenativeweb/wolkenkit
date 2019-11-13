import { ClientMetadata } from '../utils/http/ClientMetadata';
import { ClientService } from './ClientService';

const getClientService = function ({ clientMetadata }: {
  clientMetadata: ClientMetadata;
}): ClientService {
  return clientMetadata;
};

export { getClientService };
