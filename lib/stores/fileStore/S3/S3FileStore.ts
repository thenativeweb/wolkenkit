import { Client } from 'minio';
import { errors } from '../../../common/errors';
import { FileStore } from '../FileStore';
import { Metadata } from '../Metadata';
import { OwnedAuthorizationOptions } from '../../../apis/getFile/http/v2/isAuthorized/AuthorizationOptions';
import { Readable } from 'stream';
import streamToString from 'stream-to-string';

class S3FileStore implements FileStore {
  protected client: Client;

  protected bucketName: string;

  protected region: string;

  protected constructor ({
    hostName,
    port,
    encryptConnection,
    accessKey,
    secretKey,
    region,
    bucketName
  }: {
    hostName: string;
    port: number;
    encryptConnection: boolean;
    accessKey: string;
    secretKey: string;
    region: string;
    bucketName: string;
  }) {
    this.client = new Client({
      endPoint: hostName,
      port,
      accessKey,
      secretKey,
      region,
      useSSL: encryptConnection
    });

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
  }: {
    hostName?: string;
    port?: number;
    encryptConnection?: boolean;
    accessKey: string;
    secretKey: string;
    region?: string;
    bucketName: string;
  }): Promise<S3FileStore> {
    const s3 = new S3FileStore({
      hostName,
      port,
      encryptConnection,
      accessKey,
      secretKey,
      region,
      bucketName
    });

    await s3.ensureBucket();

    return s3;
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

  public async addFile ({ id, fileName, contentType, isAuthorized, stream }: {
    id: string;
    fileName: string;
    contentType: string;
    isAuthorized: OwnedAuthorizationOptions;
    stream: Readable;
  }): Promise<void> {
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
      fileName,
      contentType,
      contentLength,
      isAuthorized
    };

    await this.client.putObject(this.bucketName, `${id}/metadata.json`, JSON.stringify(metadata));
  }

  public async getMetadata ({ id }: { id: string }): Promise<Metadata> {
    try {
      await this.client.statObject(this.bucketName, `${id}/data`);
      await this.client.statObject(this.bucketName, `${id}/metadata.json`);
    } catch (ex) {
      if (ex.code === 'NotFound') {
        throw new errors.FileNotFound();
      }

      throw ex;
    }

    const metadataStream = await this.client.getObject(this.bucketName, `${id}/metadata.json`) as Readable;
    const rawMetadata = await streamToString(metadataStream);

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
    try {
      await this.client.statObject(this.bucketName, `${id}/data`);
      await this.client.statObject(this.bucketName, `${id}/metadata.json`);
    } catch (ex) {
      if (ex.code === 'NotFound') {
        throw new errors.FileNotFound();
      }

      throw ex;
    }

    const stream = await this.client.getObject(this.bucketName, `${id}/data`) as Readable;

    return stream;
  }

  public async removeFile ({ id }: { id: string }): Promise<void> {
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

  public async transferOwnership ({ id, to }: {
    id: string;
    to: string;
  }): Promise<void> {
    try {
      await this.client.statObject(this.bucketName, `${id}/data`);
      await this.client.statObject(this.bucketName, `${id}/metadata.json`);
    } catch (ex) {
      if (ex.code === 'NotFound') {
        throw new errors.FileNotFound();
      }

      throw ex;
    }

    const metadataStream = await this.client.getObject(this.bucketName, `${id}/metadata.json`) as Readable;
    const rawMetadata = await streamToString(metadataStream);

    const metadata = JSON.parse(rawMetadata);

    metadata.isAuthorized.owner = to;

    await this.client.putObject(this.bucketName, `${id}/metadata.json`, JSON.stringify(metadata));
  }

  public async authorize ({ id, isAuthorized }: {
    id: string;
    isAuthorized: OwnedAuthorizationOptions;
  }): Promise<void> {
    try {
      await this.client.statObject(this.bucketName, `${id}/data`);
      await this.client.statObject(this.bucketName, `${id}/metadata.json`);
    } catch (ex) {
      if (ex.code === 'NotFound') {
        throw new errors.FileNotFound();
      }

      throw ex;
    }

    const metadataStream = await this.client.getObject(this.bucketName, `${id}/metadata.json`) as Readable;
    const rawMetadata = await streamToString(metadataStream);

    const metadata = JSON.parse(rawMetadata);

    metadata.isAuthorized = isAuthorized;

    await this.client.putObject(this.bucketName, `${id}/metadata.json`, JSON.stringify(metadata));
  }
}

export { S3FileStore };
