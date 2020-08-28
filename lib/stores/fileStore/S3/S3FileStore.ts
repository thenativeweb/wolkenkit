import { Client } from 'minio';
import { errors } from '../../../common/errors';
import { FileAddMetadata } from '../FileAddMetadata';
import { FileMetadata } from '../FileMetadata';
import { FileStore } from '../FileStore';
import { Readable } from 'stream';
import { S3FileStoreOptions } from './S3FileStoreOptions';
import streamToString from 'stream-to-string';

class S3FileStore implements FileStore {
  protected client: Client;

  protected bucketName: string;

  protected region: string;

  protected constructor ({ client, region, bucketName }: {
    client: Client;
    region: string;
    bucketName: string;
  }) {
    this.client = client;
    this.bucketName = bucketName;
    this.region = region;
  }

  public static async create ({
    hostName = 's3.amazonaws.com',
    port = 443,
    encryptConnection = false,
    accessKey,
    secretKey,
    region = 'eu-central-1a',
    bucketName
  }: S3FileStoreOptions): Promise<S3FileStore> {
    const client = new Client({
      endPoint: hostName,
      port,
      accessKey,
      secretKey,
      region,
      useSSL: encryptConnection
    });

    return new S3FileStore({ client, region, bucketName });
  }

  protected async ensureBucket (): Promise<void> {
    try {
      await this.client.makeBucket(this.bucketName, this.region);
    } catch (ex) {
      // S3 differs between a bucket that already exists and is owned by someone
      // else, and a bucket that already exists and is owned by you. If a bucket
      // already exists and is owned by someone else, you get a BucketAlreadyExists
      // error. Since this is actually an error, we don't ignore it. If a bucket
      // already exists and belongs to you, everything is fine, and we can skip
      // this error.
      if (ex.code !== 'BucketAlreadyOwnedByYou') {
        throw ex;
      }
    }
  }

  public async addFile ({ id, name, contentType, stream }: FileAddMetadata & {
    stream: Readable;
  }): Promise<FileMetadata> {
    let statsData,
        statsMetadata;

    try {
      statsData = await this.client.statObject(this.bucketName, `${id}/data`);
      statsMetadata = await this.client.statObject(this.bucketName, `${id}/metadata.json`);
    } catch (ex) {
      if (ex.code !== 'NotFound') {
        throw ex;
      }

      // Intentionally left blank.
    }

    if (statsData ?? statsMetadata) {
      throw new errors.FileAlreadyExists();
    }

    let contentLength = 0;

    stream.on('data', (data): void => {
      contentLength += data.length;
    });

    await this.client.putObject(this.bucketName, `${id}/data`, stream);

    const metadata = {
      id,
      name,
      contentType,
      contentLength
    };

    await this.client.putObject(this.bucketName, `${id}/metadata.json`, JSON.stringify(metadata));

    return metadata;
  }

  public async getFile ({ id }: {
    id: string;
  }): Promise<Readable> {
    try {
      await this.client.statObject(this.bucketName, `${id}/data`);
      await this.client.statObject(this.bucketName, `${id}/metadata.json`);
    } catch (ex) {
      if (ex.code === 'NotFound') {
        throw new errors.FileNotFound();
      }

      throw ex;
    }

    const stream = await this.client.getObject(this.bucketName, `${id}/data`);

    return stream;
  }

  public async getMetadata ({ id }: {
    id: string;
  }): Promise<FileMetadata> {
    try {
      await this.client.statObject(this.bucketName, `${id}/data`);
      await this.client.statObject(this.bucketName, `${id}/metadata.json`);
    } catch (ex) {
      if (ex.code === 'NotFound') {
        throw new errors.FileNotFound();
      }

      throw ex;
    }

    const metadataStream = await this.client.getObject(this.bucketName, `${id}/metadata.json`);
    const rawMetadata = await streamToString(metadataStream);

    const metadata = JSON.parse(rawMetadata);

    return metadata;
  }

  public async removeFile ({ id }: {
    id: string;
  }): Promise<void> {
    const files = [ `${id}/data`, `${id}/metadata.json` ];

    let notFoundErrors = 0;

    for (const file of files) {
      try {
        await this.client.statObject(this.bucketName, file);
        await this.client.removeObject(this.bucketName, file);
      } catch (ex) {
        if (ex.code !== 'NotFound') {
          throw ex;
        }

        notFoundErrors += 1;
      }
    }

    if (notFoundErrors === files.length) {
      throw new errors.FileNotFound();
    }
  }

  public async setup (): Promise<void> {
    await this.ensureBucket();
  }

  // eslint-disable-next-line class-methods-use-this
  public async destroy (): Promise<void> {
    // There is nothing to do here.
  }
}

export { S3FileStore };
