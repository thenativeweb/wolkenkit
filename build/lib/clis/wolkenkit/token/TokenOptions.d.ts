import { RootOptions } from '../RootOptions';
export interface TokenOptions extends RootOptions {
    issuer: string;
    'private-key': string;
    claims: string;
    expiration: number;
    raw: boolean;
}
