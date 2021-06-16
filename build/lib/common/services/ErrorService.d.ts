import * as errors from '../errors';
export declare type ErrorService<TKey extends keyof typeof errors> = Pick<typeof errors, TKey>;
