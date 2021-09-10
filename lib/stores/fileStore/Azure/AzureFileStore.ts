import { AzureFileStoreOptions } from './AzureFileStoreOptions';
import { FileAddMetadata } from '../FileAddMetadata';
import { FileMetadata } from '../FileMetadata';
import { FileStore } from '../FileStore';
import { Readable } from 'stream';
import { streamToBuffer } from '@jorgeferrero/stream-to-buffer';
import streamToString from 'stream-to-string';
import {
  BlobServiceClient,
  ContainerClient,
  newPipeline,
  StorageSharedKeyCredential
} from '@azure/storage-blob';
import * as errors from '../../../common/errors';

class AzureFileStore implements FileStore {
  protected containerClient: ContainerClient;

  protected bufferSize?: number;

  protected maxConcurrency?: number;

  protected constructor ({
    containerClient,
    bufferSize,
    maxConcurrency
  }: {
    containerClient: ContainerClient;
    bufferSize?: number;
    maxConcurrency?: number;
  }) {
    this.bufferSize = bufferSize;
    this.maxConcurrency = maxConcurrency;
    this.containerClient = containerClient;
  }

  public static async create ({
    hostName,
    port,
    accountName,
    accountKey,
    containerName,
    bufferSize,
    maxConcurrency
  }: AzureFileStoreOptions): Promise<AzureFileStore> {
    const sharedKeyCredential = new StorageSharedKeyCredential(
      accountName,
      accountKey
    );

    const pipeline = newPipeline(sharedKeyCredential);

    const url =
      hostName === 'localhost'
        ? `http://${hostName}:${port}/${accountName}`
        : `https://${accountName}.blob.core.windows.net`;

    const blobServiceClient = new BlobServiceClient(
      url,
      pipeline
    );

    const containerClient = blobServiceClient.getContainerClient(containerName);

    return new AzureFileStore({
      containerClient,
      bufferSize,
      maxConcurrency
    });
  }

  protected async ensureContainer (): Promise<void> {
    try {
      await this.containerClient.create();
    } catch (ex: unknown) {
      // If a container already exists and belongs to you,
      // everything is fine, and we can skip this error.

      if ((ex as any).code !== 'ContainerAlreadyExists') {
        throw ex;
      }
    }
  }

  public async addFile ({
    id,
    name,
    contentType,
    stream
  }: FileAddMetadata & {
    stream: Readable;
  }): Promise<FileMetadata> {
    const blockBlobClientData = this.containerClient.getBlockBlobClient(
      `${id}/data`
    );
    const blockBlobClientMetadata = this.containerClient.getBlockBlobClient(
      `${id}/metadata.json`
    );

    const dataExists = await blockBlobClientData.exists();
    const metadataExists = await blockBlobClientMetadata.exists();

    if (dataExists || metadataExists) {
      throw new errors.FileAlreadyExists();
    }

    let contentLength = 0;

    stream.on('data', (data): void => {
      contentLength += data.length;
    });

    await blockBlobClientData.uploadStream(
      stream,
      this.bufferSize,
      this.maxConcurrency,
      {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        blobHTTPHeaders: {
          blobContentType: contentType
        }
      }
    );

    const metadata = {
      id,
      name,
      contentType,
      contentLength
    };

    const metadataStream = Readable.from(JSON.stringify(metadata));

    await blockBlobClientMetadata.uploadStream(
      metadataStream,
      this.bufferSize,
      this.maxConcurrency,
      {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        blobHTTPHeaders: {
          blobContentType: contentType
        }
      }
    );

    return metadata;
  }

  public async getFile ({ id }: { id: string }): Promise<Readable> {
    const blockBlobClientData = this.containerClient.getBlockBlobClient(
      `${id}/data`
    );
    const blockBlobClientMetadata = this.containerClient.getBlockBlobClient(
      `${id}/metadata.json`
    );

    const dataExists = await blockBlobClientData.exists();
    const metadataExists = await blockBlobClientMetadata.exists();

    if (!dataExists || !metadataExists) {
      throw new errors.FileNotFound();
    }

    const blockBlobResponse = await blockBlobClientData.download(0);
    const buffer = await streamToBuffer(blockBlobResponse.readableStreamBody!);

    return Readable.from(buffer);
  }

  public async getMetadata ({ id }: { id: string }): Promise<FileMetadata> {
    const blockBlobClientData = this.containerClient.getBlockBlobClient(
      `${id}/data`
    );
    const blockBlobClientMetadata = this.containerClient.getBlockBlobClient(
      `${id}/metadata.json`
    );

    const dataExists = await blockBlobClientData.exists();
    const metadataExists = await blockBlobClientMetadata.exists();

    if (!dataExists || !metadataExists) {
      throw new errors.FileNotFound();
    }

    const blockBlobResponse = await blockBlobClientMetadata.download(0);

    const rawMetadata = await streamToString(
      blockBlobResponse.readableStreamBody!
    );

    const metadata = JSON.parse(rawMetadata);

    return metadata;
  }

  public async removeFile ({ id }: { id: string }): Promise<void> {
    const blockBlobClientData = this.containerClient.getBlockBlobClient(
      `${id}/data`
    );
    const blockBlobClientMetadata = this.containerClient.getBlockBlobClient(
      `${id}/metadata.json`
    );

    const dataExists = await blockBlobClientData.exists();
    const metadataExists = await blockBlobClientMetadata.exists();

    if (!dataExists || !metadataExists) {
      throw new errors.FileNotFound();
    }

    await blockBlobClientData.delete();
    await blockBlobClientMetadata.delete();
  }

  public async setup (): Promise<void> {
    await this.ensureContainer();
  }

  // eslint-disable-next-line class-methods-use-this
  public async destroy (): Promise<void> {
    // There is nothing to do here.
  }
}

export { AzureFileStore };
