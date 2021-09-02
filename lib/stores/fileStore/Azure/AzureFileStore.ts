import { AzureFileStoreOptions } from './AzureFileStoreOptions';
import { FileAddMetadata } from '../FileAddMetadata';
import { FileMetadata } from '../FileMetadata';
import { FileStore } from '../FileStore';
import { Readable } from 'stream';
import { streamToBuffer } from '@jorgeferrero/stream-to-buffer';
import streamToString from 'stream-to-string';
import {
  BlobServiceClient,
  newPipeline,
  StorageSharedKeyCredential
} from '@azure/storage-blob';

// eslint-disable-next-line @typescript-eslint/naming-convention
const ONE_MEGABYTE = 1_024 * 1_024;
const uploadOptions = { bufferSize: 2 * ONE_MEGABYTE, maxBuffers: 20 };

class AzureFileStore implements FileStore {
  protected containerName: string;

  protected blobServiceClient: BlobServiceClient;

  protected constructor ({
    accountName,
    accountKey,
    containerName
  }: {
    accountName: string;
    accountKey: string;
    containerName: string;
  }) {
    this.containerName = containerName;

    const sharedKeyCredential = new StorageSharedKeyCredential(
      accountName,
      accountKey
    );

    const pipeline = newPipeline(sharedKeyCredential);

    this.blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      pipeline
    );
  }

  public static async create ({
    accountName,
    accountKey,
    containerName
  }: AzureFileStoreOptions): Promise<AzureFileStore> {
    return new AzureFileStore({ accountName, accountKey, containerName });
  }

  public async addFile ({
    id,
    name,
    contentType,
    stream
  }: FileAddMetadata & {
    stream: Readable;
  }): Promise<FileMetadata> {
    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName
    );
    let blockBlobClient = containerClient.getBlockBlobClient(`${id}/data`);

    let contentLength = 0;

    stream.on('data', (data): void => {
      contentLength += data.length;
    });

    await blockBlobClient.uploadStream(
      stream,
      uploadOptions.bufferSize,
      uploadOptions.maxBuffers,
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

    blockBlobClient = containerClient.getBlockBlobClient(`${id}/metadata.json`);

    // Xconst metadataStream = new Readable();
    // metadataStream.push(JSON.stringify(metadata));
    // metadataStream.push(null);

    // eslint-disable-next-line no-console
    console.log(metadata);

    const metadataStream = Readable.from(JSON.stringify(metadata));

    await blockBlobClient.uploadStream(
      metadataStream,
      uploadOptions.bufferSize,
      uploadOptions.maxBuffers,
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
    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName
    );

    // Xconst blobName = '4054751448528897-Anmeldung.pdf';
    const blockBlobClient = containerClient.getBlockBlobClient(`${id}/data`);
    const blockBlobResponse = await blockBlobClient.download(0);

    // XrXeturn <Readable>{};

    //   if (downloadBlockBlobResponse.readableStreamBody) {
    // const metadataStream = new Readable();

    // Readable.from(downloadBlockBlobResponse.readableStreamBody);

    // const stream = fs.createReadStream(fileData);

    // downloadBlockBlobResponse.readableStreamBody?.pipe(metadataStream.push());
    const buffer = await streamToBuffer(blockBlobResponse.readableStreamBody!);

    return Readable.from(buffer);
  }

  public async getMetadata ({ id }: { id: string }): Promise<FileMetadata> {
    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName
    );

    const blockBlobClient = containerClient.getBlockBlobClient(
      `${id}/metadata.json`
    );
    const blockBlobResponse = await blockBlobClient.download(0);

    const rawMetadata = await streamToString(
      blockBlobResponse.readableStreamBody!
    );

    const metadata = JSON.parse(rawMetadata);

    return metadata;
  }

  // eslint-disable-next-line class-methods-use-this
  public async removeFile ({ id }: { id: string }): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(id);
  }

  // eslint-disable-next-line class-methods-use-this
  public async setup (): Promise<void> {
    // eslint-disable-next-line no-console
    console.log('setup');
  }

  // eslint-disable-next-line class-methods-use-this
  public async destroy (): Promise<void> {
    // There is nothing to do here.
  }
}

export { AzureFileStore };
