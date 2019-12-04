import { errors } from '../../../common/errors';
import { exists } from '../../../common/utils/fs/exists';
import { FileStore } from '../FileStore';
import fs from 'fs';
import { isolated } from 'isolated';
import { Metadata } from '../Metadata';
import { OwnedAuthorizationOptions } from '../../../apis/getFile/http/v2/isAuthorized/AuthorizationOptions';
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

  public async addFile ({ id, fileName, contentType, isAuthorized, stream }: {
    id: string;
    fileName: string;
    contentType: string;
    isAuthorized: OwnedAuthorizationOptions;
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
      contentLength,
      isAuthorized
    };

    await fs.promises.writeFile(fileMetadata, JSON.stringify(metadata), 'utf8');
  }

  public async getMetadata ({ id }: { id: string }): Promise<Metadata> {
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
      contentLength: metadata.contentLength,
      isAuthorized: metadata.isAuthorized
    };
  }

  public async getFile ({ id }: { id: string }): Promise<Readable> {
    const fileDirectory = path.join(this.directory, id);
    const fileData = path.join(fileDirectory, 'data');

    if (!await exists({ path: fileDirectory })) {
      throw new errors.FileNotFound();
    }

    const stream = fs.createReadStream(fileData);

    return stream;
  }

  public async removeFile ({ id }: { id: string }): Promise<void> {
    const fileDirectory = path.join(this.directory, id);

    if (!await exists({ path: fileDirectory })) {
      throw new errors.FileNotFound();
    }

    await fs.promises.rmdir(fileDirectory, { recursive: true });
  }

  public async transferOwnership ({ id, to }: {
    id: string;
    to: string;
  }): Promise<void> {
    const fileDirectory = path.join(this.directory, id);
    const fileMetadata = path.join(fileDirectory, 'metadata.json');

    if (!await exists({ path: fileDirectory })) {
      throw new errors.FileNotFound();
    }

    const rawMetadata = await fs.promises.readFile(fileMetadata, 'utf8');
    const metadata = JSON.parse(rawMetadata);

    metadata.isAuthorized.owner = to;

    await fs.promises.writeFile(fileMetadata, JSON.stringify(metadata), 'utf8');
  }

  public async authorize ({ id, isAuthorized }: {
    id: string;
    isAuthorized: OwnedAuthorizationOptions;
  }): Promise<void> {
    const fileDirectory = path.join(this.directory, id);
    const fileMetadata = path.join(fileDirectory, 'metadata.json');

    if (!await exists({ path: fileDirectory })) {
      throw new errors.FileNotFound();
    }

    const rawMetadata = await fs.promises.readFile(fileMetadata, 'utf8');
    const metadata = JSON.parse(rawMetadata);

    metadata.isAuthorized = isAuthorized;

    await fs.promises.writeFile(fileMetadata, JSON.stringify(metadata), 'utf8');
  }
}

export { FileSystemFileStore };
