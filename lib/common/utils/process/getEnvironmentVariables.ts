import processenv from 'processenv';

const getEnvironmentVariables = function <T extends Record<string, any>> (
  requiredEnvironmentVariables: T
): {[ TKey in keyof T ]: T[TKey] } {
  const environmentVariables: Partial<{[ TKey in keyof T ]: T[TKey]}> = {};

  /* eslint-disable guard-for-in */
  for (const name in requiredEnvironmentVariables) {
    const defaultValue = requiredEnvironmentVariables[name];
    const value = processenv(name, defaultValue);

    if (value === undefined) {
      throw new Error(`Required environment variable '${name}' is not set.`);
    }

    environmentVariables[name] = value;
  }
  /* eslint-enable guard-for-in */

  return environmentVariables as {[ TKey in keyof T ]: T[TKey]};
};

export { getEnvironmentVariables };
