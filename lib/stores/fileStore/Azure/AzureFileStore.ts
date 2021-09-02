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

  protected bufferSize: number;

  protected maxConcurrency: number;

  protected constructor ({
    accountName,
    accountKey,
    containerName,
    bufferSize,
    maxConcurrency
  }: {
    accountName: string;
    accountKey: string;
    containerName: string;
    bufferSize: number;
    maxConcurrency: number;
  }) {
    this.bufferSize = bufferSize;
    this.maxConcurrency = maxConcurrency;

    const sharedKeyCredential = new StorageSharedKeyCredential(
      accountName,
      accountKey
    );

    const pipeline = newPipeline(sharedKeyCredential);

    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      pipeline
    );

    this.containerClient = blobServiceClient.getContainerClient(containerName);
  }

  public static async create ({
    accountName,
    accountKey,
    containerName,
    bufferSize,
    maxConcurrency
  }: AzureFileStoreOptions): Promise<AzureFileStore> {
    return new AzureFileStore({
      accountName,
      accountKey,
      containerName,
      bufferSize,
      maxConcurrency
    });
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

  // eslint-disable-next-line class-methods-use-this
  public async setup (): Promise<void> {
    // There is nothing to do here.
  }

  // eslint-disable-next-line class-methods-use-this
  public async destroy (): Promise<void> {
    // There is nothing to do here.
  }
}

export { AzureFileStore };
