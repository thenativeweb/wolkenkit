import { errors } from '../../../common/errors';
import { exists } from '../../../common/utils/fs/exists';
import { FileMetadata } from '../FileMetadata';
import { FileStore } from '../FileStore';
import fs from 'fs';
import { isolated } from 'isolated';
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

  public static async create ({ directory }: {
    directory?: string;
  }): Promise<FileSystemFileStore> {
    return new FileSystemFileStore({
      directory: directory ?? await isolated()
    });
  }

  public async addFile ({ id, fileName, contentType, stream }: {
    id: string;
    fileName: string;
    contentType: string;
    stream: Readable;
  }): Promise<void> {
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
      fileName,
      contentType,
      contentLength
    };

    await fs.promises.writeFile(fileMetadata, JSON.stringify(metadata), 'utf8');
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

    return {
      id,
      fileName: metadata.fileName,
      contentType: metadata.contentType,
      contentLength: metadata.contentLength
    };
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
