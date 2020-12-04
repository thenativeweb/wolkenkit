import { Aggregate } from 'wolkenkit';
import { Infrastructure } from '../../../infrastructure';
import { sampleCommand } from './commands/sampleCommand';
import { sampleDomainEvent } from './domainEvents/sampleDomainEvent';
import { getInitialState, SampleState } from './SampleState';

const sampleAggregate: Aggregate<SampleState, Infrastructure> = {
  getInitialState,
  commandHandlers: {
    sampleCommand
  },
  domainEventHandlers: {
    sampleDomainEvent
  }
};

export default sampleAggregate;
