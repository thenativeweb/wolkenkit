import { FileMetadata } from './FileMetadata';
import { Readable } from 'stream';

export interface FileStore {
  addFile ({ id, fileName, contentType, stream }: {
    id: string;
    fileName: string;
    contentType: string;
    stream: Readable;
  }): Promise<void>;

  getFile ({ id }: {
    id: string;
  }): Promise<Readable>;

  getMetadata ({ id }: {
    id: string;
  }): Promise<FileMetadata>;

  removeFile ({ id }: {
    id: string;
  }): Promise<void>;
}
