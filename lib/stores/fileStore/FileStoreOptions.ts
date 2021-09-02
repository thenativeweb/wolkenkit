import { AzureFileStoreOptions } from './Azure';
import { FileSystemFileStoreOptions } from './FileSystem';
import { InMemoryFileStoreOptions } from './InMemory';
import { S3FileStoreOptions } from './S3';

export type FileStoreOptions =
  AzureFileStoreOptions |
  FileSystemFileStoreOptions |
  InMemoryFileStoreOptions |
  S3FileStoreOptions;
