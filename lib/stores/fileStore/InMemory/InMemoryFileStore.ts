import { errors } from '../../../common/errors';
import { FileAddMetadata } from '../FileAddMetadata';
import { FileMetadata } from '../FileMetadata';
import { FileStore } from '../FileStore';
import { Readable } from 'stream';

class InMemoryFileStore implements FileStore {
  protected files: Record<string, { data: Buffer; metadata: FileMetadata } | undefined>;

  protected constructor () {
    this.files = {};
  }

  public static async create (): Promise<InMemoryFileStore> {
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

    for await (const chunk of stream) {
      chunks.push(chunk);
      contentLength += chunk.length;
    }

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
}

export { InMemoryFileStore };
