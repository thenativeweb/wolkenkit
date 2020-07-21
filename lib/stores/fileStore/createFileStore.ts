import { errors } from '../../common/errors';
import { FileStore } from './FileStore';
import { FileSystemFileStore } from './FileSystem';
import { InMemoryFileStore } from './InMemory';
import { S3FileStore } from './S3';

const createFileStore = async function ({ type, options }: {
  type: string;
  options: any;
}): Promise<FileStore> {
  switch (type) {
    case 'FileSystem': {
      return FileSystemFileStore.create(options);
    }
    case 'InMemory': {
      return InMemoryFileStore.create();
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
