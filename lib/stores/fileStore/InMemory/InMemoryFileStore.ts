import { errors } from '../../../common/errors';
import { FileAddMetadata } from '../FileAddMetadata';
import { FileMetadata } from '../FileMetadata';
import { FileStore } from '../FileStore';
import { forAwaitOf } from '../../../common/utils/forAwaitOf';
import { InMemoryFileStoreOptions } from './InMemoryFileStoreOptions';
import { Readable } from 'stream';

class InMemoryFileStore implements FileStore {
  protected files: Record<string, { data: Buffer; metadata: FileMetadata } | undefined>;

  protected constructor () {
    this.files = {};
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static async create (_options: InMemoryFileStoreOptions): Promise<InMemoryFileStore> {
    return new InMemoryFileStore();
  }

  public async addFile ({ id, name, contentType, stream }: FileAddMetadata & {
    stream: Readable;
  }): Promise<FileMetadata> {
    if (this.files[id]) {
      throw new errors.FileAlreadyExists();
    }

    const chunks: Buffer[] = [];
    let contentLength = 0;

    await forAwaitOf(stream, async (chunk): Promise<void> => {
      chunks.push(chunk);
      contentLength += chunk.length;
    });

    const data = Buffer.concat(chunks),
          metadata = { id, name, contentType, contentLength };

    this.files[id] = {
      data,
      metadata
    };

    return metadata;
  }

  public async getFile ({ id }: {
    id: string;
  }): Promise<Readable> {
    const file = this.files[id];

    if (!file) {
      throw new errors.FileNotFound();
    }

    const stream = Readable.from(file.data);

    return stream;
  }

  public async getMetadata ({ id }: {
    id: string;
  }): Promise<FileMetadata> {
    const file = this.files[id];

    if (!file) {
      throw new errors.FileNotFound();
    }

    return file.metadata;
  }

  public async removeFile ({ id }: {
    id: string;
  }): Promise<void> {
    const file = this.files[id];

    if (!file) {
      throw new errors.FileNotFound();
    }

    Reflect.deleteProperty(this.files, id);
  }

  // eslint-disable-next-line class-methods-use-this
  public async setup (): Promise<void> {
    // There is nothing to do here.
  }

  // eslint-disable-next-line class-methods-use-this
  public async destroy (): Promise<void> {
    // There is nothing to do here.
  }
}

export { InMemoryFileStore };
