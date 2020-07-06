import { FlowDefinition } from '../common/application/FlowDefinition';

export type FlowEnhancer = (flow: FlowDefinition) => FlowDefinition;
