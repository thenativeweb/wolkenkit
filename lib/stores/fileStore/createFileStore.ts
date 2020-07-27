import { errors } from '../../common/errors';
import { FileStore } from './FileStore';
import { FileSystemFileStore, FileSystemFileStoreOptions } from './FileSystem';
import { InMemoryFileStore, InMemoryFileStoreOptions } from './InMemory';
import { S3FileStore, S3FileStoreOptions } from './S3';

const createFileStore = async function (
  options: FileSystemFileStoreOptions | InMemoryFileStoreOptions | S3FileStoreOptions
): Promise<FileStore> {
  switch (options.type) {
    case 'FileSystem': {
      return FileSystemFileStore.create(options);
    }
    case 'InMemory': {
      return InMemoryFileStore.create(options);
    }
    case 'S3': {
      return S3FileStore.create(options);
    }
    default: {
      throw new errors.DatabaseTypeInvalid();
    }
  }
};

export { createFileStore };
