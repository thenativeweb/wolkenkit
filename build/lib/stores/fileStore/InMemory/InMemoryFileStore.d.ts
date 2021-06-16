/// <reference types="node" />
import { FileAddMetadata } from '../FileAddMetadata';
import { FileMetadata } from '../FileMetadata';
import { FileStore } from '../FileStore';
import { InMemoryFileStoreOptions } from './InMemoryFileStoreOptions';
import { Readable } from 'stream';
declare class InMemoryFileStore implements FileStore {
    protected files: Record<string, {
        data: Buffer;
        metadata: FileMetadata;
    } | undefined>;
    protected constructor();
    static create(options: InMemoryFileStoreOptions): Promise<InMemoryFileStore>;
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
export { InMemoryFileStore };
