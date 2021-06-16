import { FileStore } from './FileStore';
import { FileStoreOptions } from './FileStoreOptions';
declare const createFileStore: (options: FileStoreOptions) => Promise<FileStore>;
export { createFileStore };
