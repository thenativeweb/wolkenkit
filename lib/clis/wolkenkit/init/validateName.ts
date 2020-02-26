import { nameRegularExpression } from './nameRegularExpression';

const validateName = function (value: string): void {
  if (!nameRegularExpression.test(value)) {
    throw new Error(`Name must only contain lowercase characters and dashes.`);
  }
};

export { validateName };
