import { Writable } from 'stream';

export enum LogLevel {
  Fatal = 'fatal',
  Error = 'error',
  Warn = 'warn',
  Debug = 'debug',
  Info = 'info'
}

export interface Logger {
  fatal(message: string, metadata?: any): void;
  error(message: string, metadata?: any): void;
  warn(message: string, metadata?: any): void;
  debug(message: string, metadata?: any): void;
  info(message: string, metadata?: any): void;
}

declare const flaschenpost: {
  getLogger(source?: string): Logger;

  use(key: 'host', options: string): void;
  use(key: 'levels', options: LogLevel[]): void;

  Middleware: new(logLevel: LogLevel, source?: string) => Writable;
};

export default flaschenpost;
