// @ts-ignore
import { Aggregate, AskInfrastructure, State, TellInfrastructure } from 'wolkenkit';
import { execute } from './commands/execute';
import { executed } from './domainEvents/executed';
import { getInitialState } from './SampleState';
import { succeeded } from './domainEvents/succeeded';

const sampleAggregate: Aggregate<State, AskInfrastructure & TellInfrastructure> = {
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
