import { errors } from '../errors';
import { exists } from '../utils/fs/exists';
import { FlowDefinition } from './FlowDefinition';
import { FlowEnhancer } from '../../tools/FlowEnhancer';
import { FlowsDefinition } from './FlowsDefinition';
import { promises as fs } from 'fs';
import path from 'path';
import { validateFlowDefinition } from '../validators/validateFlowDefinition';

const getFlowsDefinition = async function ({ flowsDirectory }: {
  flowsDirectory: string;
}): Promise<FlowsDefinition> {
  if (!await exists({ path: flowsDirectory })) {
    throw new errors.DirectoryNotFound(`Directory '<app>/build/flows' not found.`);
  }

  const flowsDefinition: FlowsDefinition = {};

  for (const flowEntry of await fs.readdir(flowsDirectory, { withFileTypes: true })) {
    const flowName = path.basename(flowEntry.name, '.js'),
          flowPath = path.join(flowsDirectory, flowEntry.name);

    let rawFlow;

    try {
      rawFlow = (await import(flowPath)).default;
    } catch {
      // Ignore not-importable files (e.g. x.d.ts, .DS_Store).
      if (flowEntry.isFile()) {
        continue;
      }

      // But throw an error if the entry is a directory without importable content.
      throw new errors.FileNotFound(`No flow definition in '<app>/build/flows/${flowName}' found.`);
    }

    try {
      validateFlowDefinition({
        flowDefinition: rawFlow
      });
    } catch (ex) {
      throw new errors.FlowDefinitionMalformed(`Flow definition '<app>/build/flows/${flowName}' is malformed: ${ex.message}`);
    }

    const flowEnhancers = (rawFlow.enhancers || []) as FlowEnhancer[];

    const enhancedFlowDefinition = flowEnhancers.reduce(
      (flowDefinition, flowEnhancer): FlowDefinition =>
        flowEnhancer(flowDefinition),
      rawFlow
    );

    flowsDefinition[flowName] = enhancedFlowDefinition;
  }

  return flowsDefinition;
};

export { getFlowsDefinition };
