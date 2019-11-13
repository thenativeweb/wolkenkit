// @ts-ignore
import { Aggregate } from 'wolkenkit';
import { execute } from './commands/execute';
import { executed } from './domainEvents/executed';
import { succeeded } from './domainEvents/succeeded';
import { getInitialState, SampleState } from './SampleState';

const sampleAggregate: Aggregate<SampleState> = {
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
