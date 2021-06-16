import { RootOptions } from '../../../RootOptions';
export interface FileS3Options extends RootOptions {
    'host-name': string;
    port: number;
    'encrypt-connection': boolean;
    'access-key': string;
    'secret-key': string;
    region?: string;
    'bucket-name': string;
}
