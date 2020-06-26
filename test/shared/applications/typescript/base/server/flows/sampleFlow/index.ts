// @ts-ignore
import { Flow } from 'wolkenkit';
import { sampleHandler } from './handlers/sampleHandler';

const sampleFlow: Flow = {
  domainEventHandlers: {
    sampleHandler
  }
};

export default sampleFlow;
