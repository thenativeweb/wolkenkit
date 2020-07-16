import { errors } from '../errors';

export type ErrorService<TKey extends keyof typeof errors> = Pick<typeof errors, TKey>;
