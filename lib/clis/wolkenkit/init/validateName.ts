import { nameRegularExpression } from './nameRegularExpression';

const validateName = function (value: string): void {
  if (!nameRegularExpression.test(value)) {
    throw new Error('Name must be a valid npm package name.');
  }
};

export { validateName };
