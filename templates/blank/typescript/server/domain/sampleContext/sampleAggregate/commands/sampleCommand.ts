import { SampleState } from '../SampleState';
import { AggregateService, CommandData, CommandHandler, CommandWithMetadata, Schema } from 'wolkenkit';

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

  handle (state: SampleState, command: CommandWithMetadata<SampleCommandData>, { aggregate }: { aggregate: AggregateService<SampleState> }): void {
    aggregate.publishDomainEvent('sampleEvent', {});
  }
};
