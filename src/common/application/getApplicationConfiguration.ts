import { IApplicationConfigurationWeak } from './types/IApplicationConfigurationWeak';
import path from 'path';
import requireDir from 'require-dir';

const getApplicationConfiguration = async function ({ directory }: {
  directory: string;
}): Promise<IApplicationConfigurationWeak> {
  const serverDirectory = path.join(directory, 'server');
  const entries = requireDir(serverDirectory, { recurse: true });

  const { domain, views, flows }: IApplicationConfigurationWeak = entries as any;

  const transformedEntries: Partial<IApplicationConfigurationWeak> = {};

  // If an index.js file is given inside of an aggregate, list or flow, use it
  // instead of the individual files.
  for (const context of Object.values(domain)) {
    for (const [ aggregateName, aggregate ] of Object.entries(context)) {
      if (aggregate.index) {
        context[aggregateName] = { ...aggregate.index };
      }
    }
  }
  for (const modelType of Object.values(views)) {
    for (const [ modelName, model ] of Object.entries(modelType)) {
      if (model.index) {
        modelType[modelName] = { ...model.index };
      }
    }
  }
  for (const [ flowName, flow ] of Object.entries(flows)) {
    if (flow.index) {
      flows[flowName] = { ...flow.index };
    }
  }

  return transformedEntries as IApplicationConfigurationWeak;
};

export default getApplicationConfiguration;
