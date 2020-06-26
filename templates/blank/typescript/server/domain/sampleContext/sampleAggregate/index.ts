import { Aggregate } from 'wolkenkit';
import { getInitialState } from './SampleState';
import { sampleCommand } from './commands/sampleCommand';
import { sampleDomainEvent } from './domainEvents/sampleDomainEvent';

const sampleAggregate: Aggregate = {
  getInitialState,
  commandHandlers: {
    sampleCommand
  },
  domainEventHandlers: {
    sampleDomainEvent
  }
};

export default sampleAggregate;
