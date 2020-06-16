const validateExpiration = function (value: number): void {
  if (value < 1) {
    throw new Error('Expiration must be greater than 0.');
  }
};

export { validateExpiration };
