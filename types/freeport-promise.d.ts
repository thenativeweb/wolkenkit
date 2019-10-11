/* eslint-disable unicorn/filename-case */
declare module 'freeport-promise' {
    type Resolvable<T> = T | PromiseLike<T>;

    type PromiseConstructor = <T>(callback?: (resolve: (thenableOrResult?: Resolvable<T>) => void, reject: (error?: any) => void) => void) => PromiseLike<T>;

    function freeportPromise (PromiseLibrary?: PromiseConstructor): number;

    export = freeportPromise;
}
/* eslint-enable unicorn/filename-case */
