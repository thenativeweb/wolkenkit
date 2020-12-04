// @ts-ignore
import { Aggregate } from 'wolkenkit';
import { execute } from './commands/execute';
import { executed } from './domainEvents/executed';
import { Infrastructure } from '../../../infrastructure';
import { succeeded } from './domainEvents/succeeded';
import { getInitialState, SampleState } from './SampleState';

const sampleAggregate: Aggregate<SampleState, Infrastructure> = {
  getInitialState,
  commandHandlers: {
    execute
  },
  domainEventHandlers: {
    succeeded,
    executed
  }
};

export default sampleAggregate;
