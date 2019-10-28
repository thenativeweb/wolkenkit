import { errors } from '../../../common/errors';
import { FileStore } from '../FileStore';
import isolated from 'isolated';
import { Metadata } from '../Metadata';
import { OwnedAuthorizationOptions } from '../../../apis/file/Http/V2/isAuthorized/AuthorizationOptions';
import path from 'path';
import { promisify } from 'util';
import shell from 'shelljs';
import { createReadStream, createWriteStream, pathExists, readFile, writeFile } from 'fs-extra';
import { pipeline as pipelineCallback, Readable } from 'stream';

const pipeline = promisify(pipelineCallback);

class FileSystemFileStore implements FileStore {
  protected directory: string;

  protected constructor ({ directory }: {
    directory: string;
  }) {
    this.directory = directory;
  }

  public static async create ({ optionalDirectory }: {
    optionalDirectory?: string;
  }): Promise<FileSystemFileStore> {
    let directory = optionalDirectory;

    if (!directory) {
      directory = await isolated();
    }

    return new FileSystemFileStore({ directory });
  }

  public async addFile ({ id, fileName, contentType, isAuthorized, stream }: {
    id: string;
    fileName: string;
    contentType: string;
    isAuthorized: OwnedAuthorizationOptions;
    stream: Readable;
  }): Promise<void> {
    const fileDirectory = path.join(this.directory, id);
    const fileFileData = path.join(fileDirectory, 'data');
    const fileFileMetadata = path.join(fileDirectory, 'metadata.json');

    if (await pathExists(fileDirectory)) {
      throw new errors.FileAlreadyExists();
    }

    shell.mkdir('-p', fileDirectory);

    const targetStream = createWriteStream(fileFileData);

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

    await writeFile(fileFileMetadata, JSON.stringify(metadata), { encoding: 'utf8' });
  }

  public async getMetadata ({ id }: { id: string }): Promise<Metadata> {
    const fileDirectory = path.join(this.directory, id);
    const fileFileMetadata = path.join(fileDirectory, 'metadata.json');

    if (!await pathExists(fileDirectory)) {
      throw new errors.FileNotFound();
    }

    const rawMetadata = await readFile(fileFileMetadata, { encoding: 'utf8' });
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
    const fileFileData = path.join(fileDirectory, 'data');

    if (!await pathExists(fileDirectory)) {
      throw new errors.FileNotFound();
    }

    const stream = createReadStream(fileFileData);

    return stream;
  }

  public async removeFile ({ id }: { id: string }): Promise<void> {
    const fileDirectory = path.join(this.directory, id);

    if (!await pathExists(fileDirectory)) {
      throw new errors.FileNotFound();
    }

    shell.rm('-rf', fileDirectory);
  }

  public async transferOwnership ({ id, to }: {
    id: string;
    to: string;
  }): Promise<void> {
    const fileDirectory = path.join(this.directory, id);
    const fileFileMetadata = path.join(fileDirectory, 'metadata.json');

    if (!await pathExists(fileDirectory)) {
      throw new errors.FileNotFound();
    }

    const rawMetadata = await readFile(fileFileMetadata, { encoding: 'utf8' });
    const metadata = JSON.parse(rawMetadata);

    metadata.isAuthorized.owner = to;

    await writeFile(fileFileMetadata, JSON.stringify(metadata), { encoding: 'utf8' });
  }

  public async authorize ({ id, isAuthorized }: {
    id: string;
    isAuthorized: OwnedAuthorizationOptions;
  }): Promise<void> {
    const fileDirectory = path.join(this.directory, id);
    const fileFileMetadata = path.join(fileDirectory, 'metadata.json');

    if (!await pathExists(fileDirectory)) {
      throw new errors.FileNotFound();
    }

    const rawMetadata = await readFile(fileFileMetadata, { encoding: 'utf8' });
    const metadata = JSON.parse(rawMetadata);

    metadata.isAuthorized = isAuthorized;

    await writeFile(fileFileMetadata, JSON.stringify(metadata), { encoding: 'utf8' });
  }
}

export { FileSystemFileStore };
