import { RootOptions } from '../RootOptions';

export interface InitOptions extends RootOptions {
  template?: string;
  language?: string;
  'out-dir'?: string;
  name: string;
}
