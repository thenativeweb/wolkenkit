import { Flow } from 'wolkenkit';
import { Infrastructure } from '../../infrastructure';
import { sampleHandler } from './handlers/sampleHandler';

const sampleFlow: Flow<Infrastructure> = {
  replayPolicy: 'never',

  domainEventHandlers: {
    sampleHandler
  }
};

export default sampleFlow;
