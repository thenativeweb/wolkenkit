import { SampleDomainEventData } from '../domainEvents/sampleDomainEvent';
import { SampleState } from '../SampleState';
import { AskInfrastructure, CommandData, CommandHandler, Schema, TellInfrastructure } from 'wolkenkit';

export type SampleCommandData = CommandData;

export const sampleCommand: CommandHandler<SampleState, SampleCommandData, AskInfrastructure & TellInfrastructure> = {
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
