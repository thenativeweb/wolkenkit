import { errors } from '../../../common/errors';
import { exists } from '../../../common/utils/fs/exists';
import { FileAddMetadata } from '../FileAddMetadata';
import { FileMetadata } from '../FileMetadata';
import { FileStore } from '../FileStore';
import { FileSystemFileStoreOptions } from './FileSystemFileStoreOptions';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { pipeline as pipelineCallback, Readable } from 'stream';

const pipeline = promisify(pipelineCallback);

class FileSystemFileStore implements FileStore {
  protected directory: string;

  protected constructor ({ directory }: {
    directory: string;
  }) {
    this.directory = directory;
  }

  public static async create ({
    directory
  }: FileSystemFileStoreOptions): Promise<FileSystemFileStore> {
    return new FileSystemFileStore({ directory });
  }

  public async addFile ({ id, name, contentType, stream }: FileAddMetadata & {
    stream: Readable;
  }): Promise<FileMetadata> {
    const fileDirectory = path.join(this.directory, id);
    const fileData = path.join(fileDirectory, 'data');
    const fileMetadata = path.join(fileDirectory, 'metadata.json');

    if (await exists({ path: fileDirectory })) {
      throw new errors.FileAlreadyExists();
    }

    await fs.promises.mkdir(fileDirectory, { recursive: true });

    const targetStream = fs.createWriteStream(fileData);

    let contentLength = 0;

    stream.on('data', (data): void => {
      contentLength += data.length;
    });

    await pipeline(stream, targetStream);

    const metadata = {
      id,
      name,
      contentType,
      contentLength
    };

    await fs.promises.writeFile(fileMetadata, JSON.stringify(metadata), 'utf8');

    return metadata;
  }

  public async getFile ({ id }: {
    id: string;
  }): Promise<Readable> {
    const fileDirectory = path.join(this.directory, id);
    const fileData = path.join(fileDirectory, 'data');

    if (!await exists({ path: fileDirectory })) {
      throw new errors.FileNotFound();
    }

    const stream = fs.createReadStream(fileData);

    return stream;
  }

  public async getMetadata ({ id }: {
    id: string;
  }): Promise<FileMetadata> {
    const fileDirectory = path.join(this.directory, id);
    const fileMetadata = path.join(fileDirectory, 'metadata.json');

    if (!await exists({ path: fileDirectory })) {
      throw new errors.FileNotFound();
    }

    const rawMetadata = await fs.promises.readFile(fileMetadata, 'utf8');
    const metadata = JSON.parse(rawMetadata);

    return metadata;
  }

  public async removeFile ({ id }: {
    id: string;
  }): Promise<void> {
    const fileDirectory = path.join(this.directory, id);

    if (!await exists({ path: fileDirectory })) {
      throw new errors.FileNotFound();
    }

    await fs.promises.rmdir(fileDirectory, { recursive: true });
  }
}

export { FileSystemFileStore };
