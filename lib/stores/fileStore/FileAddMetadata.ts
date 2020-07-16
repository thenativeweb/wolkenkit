import { FileMetadata } from './FileMetadata';

export type FileAddMetadata = Omit<FileMetadata, 'contentLength'>;
