const validateSocket = function (value: string): void {
  if (value.length === 0) {
    throw new Error('Socket must not be an empty string.');
  }
};

export { validateSocket };
