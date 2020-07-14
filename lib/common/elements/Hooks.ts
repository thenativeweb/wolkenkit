import { AskInfrastructure } from './AskInfrastructure';
import { ClientService } from '../services/ClientService';
import { FileMetadata } from '../../stores/fileStore/FileMetadata';
import { LoggerService } from '../services/LoggerService';
import { TellInfrastructure } from './TellInfrastructure';

export interface Hooks<
  TInfrastructure extends AskInfrastructure & TellInfrastructure,
  TFileMetadata extends FileMetadata = FileMetadata
> {
  apis?: {
    getFile?: {
      addingFile?: (
        addFileParameters: { id: string; fileName: string; contentType: string },
        services: {
          client: ClientService;
          infrastructure: TInfrastructure;
          logger: LoggerService;
        }
      ) => Promise<TFileMetadata> | TFileMetadata;

      addedFile?: (
        addFileParameters: { id: string; fileName: string; contentType: string },
        fileMetadata: TFileMetadata,
        services: {
          client: ClientService;
          infrastructure: TInfrastructure;
          logger: LoggerService;
        }
      ) => Promise<void> | void;
    };
  };
}
