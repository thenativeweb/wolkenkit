const retryOptions = {
  retries: 120,
  factor: 2,
  minTimeout: 100,
  maxTimeout: 1_000
};

export { retryOptions };
