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

  addedFile?: (
    fileMetadata: TFileMetadata,
    services: {
      client: ClientService;
      infrastructure: TInfrastructure;
      logger: LoggerService;
    }
  ) => Promise<void> | void;

  gettingFile?: (
    fileMetadata: TFileMetadata,
    services: {
      client: ClientService;
      error: ErrorService<'NotAuthenticated'>;
      infrastructure: TInfrastructure;
      logger: LoggerService;
    }
  ) => Promise<void> | void;

  gotFile?: (
    fileMetadata: TFileMetadata,
    services: {
      client: ClientService;
      infrastructure: TInfrastructure;
      logger: LoggerService;
    }
  ) => Promise<void> | void;

  removingFile?: (
    fileMetadata: TFileMetadata,
    services: {
      client: ClientService;
      error: ErrorService<'NotAuthenticated'>;
      infrastructure: TInfrastructure;
      logger: LoggerService;
    }
  ) => Promise<void> | void;

  removedFile?: (
    fileMetadata: TFileMetadata,
    services: {
      client: ClientService;
      infrastructure: TInfrastructure;
      logger: LoggerService;
    }
  ) => Promise<void> | void;
}
