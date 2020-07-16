import { AskInfrastructure } from './AskInfrastructure';
import { ClientService } from '../services/ClientService';
import { ErrorService } from '../services/ErrorService';
import { FileMetadata } from '../../stores/fileStore/FileMetadata';
import { LoggerService } from '../services/LoggerService';
import { TellInfrastructure } from './TellInfrastructure';

export interface Hooks<
  TInfrastructure extends AskInfrastructure & TellInfrastructure,
  TFileMetadata extends FileMetadata = FileMetadata
> {
  addedFile?: (
    fileMetadata: TFileMetadata,
    services: {
      client: ClientService;
      infrastructure: TInfrastructure;
      logger: LoggerService;
    }
  ) => Promise<void> | void;

  addingFile?: (
    file: {
      id: string;
      name: string;
      contentType: string;
    },
    services: {
      client: ClientService;
      error: ErrorService<'NotAuthenticated'>;
      infrastructure: TInfrastructure;
      logger: LoggerService;
    }
  ) => Promise<{ name: string; contentType: string }> | { name: string; contentType: string };
}
