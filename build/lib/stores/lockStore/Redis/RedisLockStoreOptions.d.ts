import { ListNames } from './ListNames';
export interface RedisLockStoreOptions {
    type: 'Redis';
    hostName: string;
    port: number;
    password: string;
    database: number;
    listNames: ListNames;
}
