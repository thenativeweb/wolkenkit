/// <reference types="node" />
import { FileAddMetadata } from './FileAddMetadata';
import { FileMetadata } from './FileMetadata';
import { Readable } from 'stream';
export interface FileStore {
    addFile: ({ id, name, contentType, stream }: FileAddMetadata & {
        stream: Readable;
    }) => Promise<FileMetadata>;
    getFile: ({ id }: {
        id: string;
    }) => Promise<Readable>;
    getMetadata: ({ id }: {
        id: string;
    }) => Promise<FileMetadata>;
    removeFile: ({ id }: {
        id: string;
    }) => Promise<void>;
    setup: () => Promise<void>;
    destroy: () => Promise<void>;
}
