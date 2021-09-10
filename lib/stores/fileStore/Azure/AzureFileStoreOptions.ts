export interface AzureFileStoreOptions {
  type: 'Azure';
  hostName?: string;
  port?: number;
  accountName: string;
  accountKey: string;
  containerName: string;
  bufferSize?: number;
  maxConcurrency?: number;
}
