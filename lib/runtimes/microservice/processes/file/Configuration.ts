import { FileStoreOptions } from '../../../../stores/fileStore/FileStoreOptions';

export interface Configuration {
  applicationDirectory: string;
  enableOpenApiDocumentation: boolean;
  fileCorsOrigin: string | string[];
  fileStoreOptions: FileStoreOptions;
  healthCorsOrigin: string | string[];
  healthPort: number;
  identityProviders: { issuer: string; certificate: string }[];
  port: number;
}
