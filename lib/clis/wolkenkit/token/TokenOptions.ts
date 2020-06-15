import { RootOptions } from '../RootOptions';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TokenOptions extends RootOptions {
  issuer: string;
  'private-key': string;
  claims: string;
  expiration: number;
}
