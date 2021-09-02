export interface AzureFileStoreOptions {
  type: 'Azure';
  accountName: string;
  accountKey: string;
  containerName: string;
  bufferSize: number;
  maxConcurrency: number;
}
