import { RootOptions } from '../RootOptions';

export interface RunOptions extends RootOptions {
  runtime: string;
  process: string;
  'health-port': number;
  debug: boolean;
}
