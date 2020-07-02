// @ts-ignore
import { FlowDefinition } from 'wolkenkit';
import { sampleHandler } from './handlers/sampleHandler';

const sampleFlow: FlowDefinition = {
  domainEventHandlers: {
    sampleHandler
  }
};

export default sampleFlow;
