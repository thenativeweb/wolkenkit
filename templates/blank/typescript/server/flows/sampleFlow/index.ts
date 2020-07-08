import { Flow } from 'wolkenkit';
import { sampleHandler } from './handlers/sampleHandler';

const sampleFlow: Flow = {
  replayPolicy: 'never',

  domainEventHandlers: {
    sampleHandler
  }
};

export default sampleFlow;
