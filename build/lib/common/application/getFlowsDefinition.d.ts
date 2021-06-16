import { FlowsDefinition } from './FlowsDefinition';
declare const getFlowsDefinition: ({ flowsDirectory }: {
    flowsDirectory: string;
}) => Promise<FlowsDefinition>;
export { getFlowsDefinition };
