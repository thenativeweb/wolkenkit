import processenv from 'processenv';

const getEnvironmentVariables = function (requiredEnvironmentVariables: {
  [key: string]: any;
}): { [key: string]: any } {
  const environmentVariables: { [key: string]: any } = {};

  for (const [ name, defaultValue ] of Object.entries(
    requiredEnvironmentVariables
  )) {
    const value = processenv(name, defaultValue);

    if (value === undefined) {
      throw new Error(`Required environment variable '${name}' is not set.`);
    }

    environmentVariables[name] = value;
  }

  return environmentVariables;
};

export default getEnvironmentVariables;
