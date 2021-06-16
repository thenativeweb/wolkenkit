import { FileSystemFileStoreOptions } from './FileSystem';
import { InMemoryFileStoreOptions } from './InMemory';
import { S3FileStoreOptions } from './S3';
export declare type FileStoreOptions = FileSystemFileStoreOptions | InMemoryFileStoreOptions | S3FileStoreOptions;
