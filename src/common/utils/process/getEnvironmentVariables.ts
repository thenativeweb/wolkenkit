import processenv from 'processenv';

const getEnvironmentVariables = function <T extends {
  [ key: string ]: any;
}> (
  requiredEnvironmentVariables: T
): {[ key in keyof T ]: T[key] } {
  const environmentVariables: Partial<{[ key in keyof T ]: T[key]}> = {};

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

  return environmentVariables as { [key in keyof T]: T[key] };
};

export default getEnvironmentVariables;
