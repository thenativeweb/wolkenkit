const validatePort = function (value: number): void {
  if (value < 0 || value > 65_535) {
    throw new Error('Port must be between 0 and 65535.');
  }
};

export { validatePort };
