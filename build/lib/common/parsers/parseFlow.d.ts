import { Flow } from '../elements/Flow';
import { Result } from 'defekt';
import * as errors from '../errors';
declare const parseFlow: ({ flowDefinition }: {
    flowDefinition: any;
}) => Result<Flow<any>, errors.FlowDefinitionMalformed>;
export { parseFlow };
