import humanizeString from 'humanize-string';

export interface ICustomError extends Error {
  name: string;
  code: string;
  message: string;
  cause?: Error;
}

type ErrorConstructors<T> = {
  [key in keyof T]: new(message?: string, cause?: Error) => ICustomError
};

const defekt = function <T extends {
  [ key: string ]: { code?: string };
}> (errorDefinitions: T): ErrorConstructors<T> {
  const errors: Partial<ErrorConstructors<T>> = {};

  /* eslint-disable guard-for-in */
  for (const errorName in errorDefinitions) {
    const errorDefinition = errorDefinitions[errorName];
    const { code = `E${errorName.toUpperCase()}` } = errorDefinition;

    errors[errorName] = class extends Error implements ICustomError {
      public name: string;

      public code: string;

      public message: string;

      public cause?: Error;

      /* eslint-disable no-loop-func */
      public constructor (message = `${humanizeString(errorName)}.`, cause?: Error) {
        super();

        this.name = errorName;
        this.code = code;
        this.message = message;
        this.cause = cause;
      }
      /* eslint-enable no-loop-func */
    };
  }
  /* eslint-enable guard-for-in */

  return errors as ErrorConstructors<T>;
};

export default defekt;
