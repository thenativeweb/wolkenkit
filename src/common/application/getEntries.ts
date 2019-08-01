import path from 'path';
import requireDir from 'require-dir';

const getEntries = async function ({ directory }: {
  directory: string;
}): Promise<{ server: {
    domain: {[contextName: string]: {[aggregateName: string]: any }};
    views: {[modelType: string]: {[modelName: string]: any }};
    flows: {[flowName: string]: any };
  };
  }> {
  const serverDirectory = path.join(directory, 'server');
  const entries = requireDir(serverDirectory, { recurse: true });

  const { domain, views, flows }: {
    domain: {[contextName: string]: {[aggregateName: string]: any }};
    views: {[modelType: string]: {[modelName: string]: any }};
    flows: {[flowName: string]: any};
  } = entries as any;

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

  return { server: entries } as any;
};

export default getEntries;
