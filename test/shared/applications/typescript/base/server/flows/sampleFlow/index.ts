// @ts-ignore
import { FlowDefinition } from 'wolkenkit';
import { sampleHandler } from './handlers/sampleHandler';

const sampleFlow: FlowDefinition = {
  replayPolicy: 'never',

  domainEventHandlers: {
    sampleHandler
  }
};

export default sampleFlow;
