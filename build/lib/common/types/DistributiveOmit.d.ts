export declare type DistributiveOmit<T, TKey extends keyof T> = T extends unknown ? Omit<T, TKey> : never;
