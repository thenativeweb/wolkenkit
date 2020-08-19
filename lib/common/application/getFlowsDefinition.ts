import { errors } from '../errors';
import { exists } from '../utils/fs/exists';
import { FlowDefinition } from './FlowDefinition';
import { FlowEnhancer } from '../../tools/FlowEnhancer';
import { FlowsDefinition } from './FlowsDefinition';
import path from 'path';
import { validateFlowDefinition } from '../validators/validateFlowDefinition';
import { constants, promises as fs } from 'fs';

const getFlowsDefinition = async function ({ flowsDirectory }: {
  flowsDirectory: string;
}): Promise<FlowsDefinition> {
  if (!await exists({ path: flowsDirectory })) {
    throw new errors.DirectoryNotFound(`Directory '<app>/build/server/flows' not found.`);
  }

  const flowsDefinition: FlowsDefinition = {};

  for (const flowEntry of await fs.readdir(flowsDirectory, { withFileTypes: true })) {
    const flowName = path.basename(flowEntry.name, '.js'),
          flowPath = path.join(flowsDirectory, flowEntry.name);

    // Ignore not-importable files (e.g. x.d.ts, .DS_Store).
    if (flowEntry.isFile() && path.extname(flowEntry.name) !== '.js') {
      continue;
    }
    if (flowEntry.isDirectory()) {
      const indexPath = path.join(flowPath, 'index.js');

      try {
        await fs.access(indexPath, constants.R_OK);
      } catch (ex) {
        throw new errors.FileNotFound(`No flow definition in '<app>/build/server/flows/${flowName}' found.`);
      }
    }

    let rawFlow;

    try {
      rawFlow = (await import(flowPath)).default;
    } catch (ex) {
      if (ex instanceof SyntaxError) {
        throw new errors.ApplicationMalformed(`Syntax error in '<app>/build/server/flows/${flowName}'.`, { cause: ex });
      }
      if (ex.code === 'MODULE_NOT_FOUND') {
        throw new errors.ApplicationMalformed(`Missing import in '<app>/build/server/flows/${flowName}'.`, { cause: ex });
      }

      throw new errors.FileNotFound(`No flow definition in '<app>/build/server/flows/${flowName}' found.`);
    }

    try {
      validateFlowDefinition({
        flowDefinition: rawFlow
      });
    } catch (ex) {
      throw new errors.FlowDefinitionMalformed(`Flow definition '<app>/build/server/flows/${flowName}' is malformed: ${ex.message}`);
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
