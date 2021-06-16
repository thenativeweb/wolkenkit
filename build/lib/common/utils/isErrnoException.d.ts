/// <reference types="node" />
declare const isErrnoException: (error: unknown) => error is NodeJS.ErrnoException;
export { isErrnoException };
