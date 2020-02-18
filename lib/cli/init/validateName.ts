const validateName = function (value: string): void {
  if (!/^[a-z][a-z-]*$/u.test(value)) {
    throw new Error(`Name must only consist of lowercase characters and dashes.`);
  }
};

export { validateName };
