import { processenv } from 'processenv';
import { Schema } from '../../elements/Schema';
import { Value } from 'validate-value';

const getEnvironmentVariables = function (
  requiredEnvironmentVariables: {
    [key: string]: {
      default?: any;
      schema?: Schema;
    };
  }
): { [key: string]: any } {
  const environmentVariables: Record<string, any> = {};

  for (const [ name, configuration ] of Object.entries(requiredEnvironmentVariables)) {
    const value = processenv(name, configuration.default);

    if (configuration.schema) {
      const validator = new Value(configuration.schema);

      validator.validate(value, { valueName: name });
    }

    if (value === undefined) {
      throw new Error(`Required environment variable '${name}' is not set.`);
    }

    environmentVariables[name] = value;
  }

  return environmentVariables;
};

export { getEnvironmentVariables };
