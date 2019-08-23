declare module 'mysql2/promise' {
  export interface Connection {
    release(): Promise<any>;
  }

  export interface ConnectionPool {
    getConnection(): Promise<Connection>;
    end(): Promise<any>;
  }

  export interface ConnectionOptions {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    connectTimeout: number;
  }
  export function createPool(options: ConnectionOptions): ConnectionPool;
}
