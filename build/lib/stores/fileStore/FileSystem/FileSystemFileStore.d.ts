/// <reference types="node" />
import { FileAddMetadata } from '../FileAddMetadata';
import { FileMetadata } from '../FileMetadata';
import { FileStore } from '../FileStore';
import { FileSystemFileStoreOptions } from './FileSystemFileStoreOptions';
import { Readable } from 'stream';
declare class FileSystemFileStore implements FileStore {
    protected directory: string;
    protected constructor({ directory }: {
        directory: string;
    });
    static create({ directory }: FileSystemFileStoreOptions): Promise<FileSystemFileStore>;
    addFile({ id, name, contentType, stream }: FileAddMetadata & {
        stream: Readable;
    }): Promise<FileMetadata>;
    getFile({ id }: {
        id: string;
    }): Promise<Readable>;
    getMetadata({ id }: {
        id: string;
    }): Promise<FileMetadata>;
    removeFile({ id }: {
        id: string;
    }): Promise<void>;
    setup(): Promise<void>;
    destroy(): Promise<void>;
}
export { FileSystemFileStore };
