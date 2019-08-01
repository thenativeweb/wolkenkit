import { Writable } from 'stream';

type LogLevel = 'fatal' | 'error' | 'warn' | 'debug' | 'info';

declare const flaschenpost: {
  getLogger(source?: string): {
    fatal(message: string, metadata?: any): void;
    error(message: string, metadata?: any): void;
    warn(message: string, metadata?: any): void;
    debug(message: string, metadata?: any): void;
    info(message: string, metadata?: any): void;
  };

  use(key: 'host', options: string): void;
  use(key: 'levels', options: LogLevel[]): void;

  Middleware: new(logLevel: LogLevel, source?: string) => Writable;
};

export default flaschenpost;
