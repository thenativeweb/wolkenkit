import { RootOptions } from '../RootOptions';

export interface DevOptions extends RootOptions {
  port?: number;
  socket?: string;
  'health-port'?: number;
  'health-socket'?: string;
  'identity-provider-issuer'?: string;
  'identity-provider-certificate'?: string;
  'identity-provider-algorithm'?: string;
  debug: boolean;
}
