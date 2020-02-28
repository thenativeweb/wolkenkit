const validatePort = function (value: number): void {
  if (value < 0 || value > 65535) {
    throw new Error(`Port must be between 0 and 65535.`);
  }
};

export { validatePort };
