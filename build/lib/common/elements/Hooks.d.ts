import { AskInfrastructure } from './AskInfrastructure';
import { ClientService } from '../services/ClientService';
import { ErrorService } from '../services/ErrorService';
import { FileAddMetadata } from '../../stores/fileStore/FileAddMetadata';
import { FileMetadata } from '../../stores/fileStore/FileMetadata';
import { LoggerService } from '../services/LoggerService';
import { TellInfrastructure } from './TellInfrastructure';
export interface Hooks<TInfrastructure extends AskInfrastructure & TellInfrastructure> {
    addingFile?: (fileMetadata: FileAddMetadata, services: {
        client: ClientService;
        error: ErrorService<'NotAuthenticated'>;
        infrastructure: TInfrastructure;
        logger: LoggerService;
    }) => Promise<{
        name: string;
        contentType: string;
    }> | {
        name: string;
        contentType: string;
    };
    addedFile?: (fileMetadata: FileMetadata, services: {
        client: ClientService;
        infrastructure: TInfrastructure;
        logger: LoggerService;
    }) => Promise<void> | void;
    gettingFile?: (fileMetadata: FileMetadata, services: {
        client: ClientService;
        error: ErrorService<'NotAuthenticated'>;
        infrastructure: TInfrastructure;
        logger: LoggerService;
    }) => Promise<void> | void;
    gotFile?: (fileMetadata: FileMetadata, services: {
        client: ClientService;
        infrastructure: TInfrastructure;
        logger: LoggerService;
    }) => Promise<void> | void;
    removingFile?: (fileMetadata: FileMetadata, services: {
        client: ClientService;
        error: ErrorService<'NotAuthenticated'>;
        infrastructure: TInfrastructure;
        logger: LoggerService;
    }) => Promise<void> | void;
    removedFile?: (fileMetadata: FileMetadata, services: {
        client: ClientService;
        infrastructure: TInfrastructure;
        logger: LoggerService;
    }) => Promise<void> | void;
}
