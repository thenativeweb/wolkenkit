import { errors } from '../../common/errors';
import { FileStore } from './FileStore';
import { FileStoreOptions } from './FileStoreOptions';
import { FileSystemFileStore } from './FileSystem';
import { InMemoryFileStore } from './InMemory';
import { S3FileStore } from './S3';

const createFileStore = async function (
  options: FileStoreOptions
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
