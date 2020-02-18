import { RootOptions } from '../RootOptions';

export interface DevOptions extends RootOptions {
  port: number;
  'identity-provider-issuer'?: string;
  'identity-provider-certificate'?: string;
  debug: boolean;
}
