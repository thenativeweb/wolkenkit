const isErrnoException = function (error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error;
};

export { isErrnoException };
