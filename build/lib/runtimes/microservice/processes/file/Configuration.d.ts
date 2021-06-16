import { FileStoreOptions } from '../../../../stores/fileStore/FileStoreOptions';
export interface Configuration {
    applicationDirectory: string;
    enableOpenApiDocumentation: boolean;
    fileCorsOrigin: string | string[];
    fileStoreOptions: FileStoreOptions;
    healthCorsOrigin: string | string[];
    healthPortOrSocket: number | string;
    identityProviders: {
        issuer: string;
        certificate: string;
    }[];
    portOrSocket: number | string;
}
