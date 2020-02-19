import { RootOptions } from '../RootOptions';

export interface BuildOptions extends RootOptions {
  runtime?: string;
  'mode'?: string;
  'image-prefix'?: string;
  'push-images': boolean;
  'base-image'?: string;
}
