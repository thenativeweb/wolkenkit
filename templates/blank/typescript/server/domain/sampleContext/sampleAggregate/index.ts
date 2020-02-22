import { Aggregate } from 'wolkenkit';
import { sampleCommand } from './commands/sampleCommand';
import { sampleDomainEvent } from './domainEvents/sampleDomainEvent';
import { getInitialState, SampleState } from './SampleState';

const sampleAggregate: Aggregate<SampleState> = {
  getInitialState,
  commandHandlers: {
    sampleCommand
  },
  domainEventHandlers: {
    sampleDomainEvent
  }
};

export default sampleAggregate;
