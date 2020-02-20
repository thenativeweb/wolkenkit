import { SampleState } from '../SampleState';
import { CommandData, CommandHandler, Schema } from 'wolkenkit';

export interface SampleCommandData extends CommandData {}

export const sampleCommand: CommandHandler<SampleState, SampleCommandData> = {
  getSchema (): Schema {
    return {
      type: 'object',
      properties: {},
      additionalProperties: false
    };
  },

  isAuthorized (): boolean {
    return true;
  },

  handle (state: any, command: any, { aggregate }: { aggregate: any }): void {
    aggregate.publishDomainEvent('sampleEvent', {});
  }
};
