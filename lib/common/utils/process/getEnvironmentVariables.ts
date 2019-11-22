import { processenv } from 'processenv';

const getEnvironmentVariables = function <T extends Record<string, any>> (
  requiredEnvironmentVariables: T
): T {
  const environmentVariables: Record<string, any> = {};

  for (const [ name, defaultValue ] of Object.entries(requiredEnvironmentVariables)) {
    const value = processenv(name, defaultValue);

    if (value === undefined) {
      throw new Error(`Required environment variable '${name}' is not set.`);
    }

    environmentVariables[name] = value;
  }

  return environmentVariables as T;
};

export { getEnvironmentVariables };
