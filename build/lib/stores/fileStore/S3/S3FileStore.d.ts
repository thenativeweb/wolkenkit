/// <reference types="node" />
import { Client } from 'minio';
import { FileAddMetadata } from '../FileAddMetadata';
import { FileMetadata } from '../FileMetadata';
import { FileStore } from '../FileStore';
import { Readable } from 'stream';
import { S3FileStoreOptions } from './S3FileStoreOptions';
declare class S3FileStore implements FileStore {
    protected client: Client;
    protected bucketName: string;
    protected region: string;
    protected constructor({ client, region, bucketName }: {
        client: Client;
        region: string;
        bucketName: string;
    });
    static create({ hostName, port, encryptConnection, accessKey, secretKey, region, bucketName }: S3FileStoreOptions): Promise<S3FileStore>;
    protected ensureBucket(): Promise<void>;
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
export { S3FileStore };
