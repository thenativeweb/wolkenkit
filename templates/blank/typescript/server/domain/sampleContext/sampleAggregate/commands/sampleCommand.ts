import { SampleDomainEventData } from '../domainEvents/sampleDomainEvent';
import { SampleState } from '../SampleState';
import { CommandData, CommandHandler, Schema } from 'wolkenkit';

export interface SampleCommandData extends CommandData {}

export const sampleCommand: CommandHandler<SampleState, SampleCommandData> = {
  getSchema (): Schema {
    return {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false
    };
  },

  isAuthorized (): boolean {
    return true;
  },

  handle (_state, _command, { aggregate }): void {
    aggregate.publishDomainEvent<SampleDomainEventData>('sampleDomainEvent', {});
  }
};
