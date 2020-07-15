import { Infrastructure } from '../../../../infrastructure';
import { SampleState } from '../SampleState';
import { CommandData, CommandHandler, Schema } from 'wolkenkit';

export type SampleCommandData = CommandData;

export const sampleCommand: CommandHandler<SampleState, SampleCommandData, Infrastructure> = {
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

  handle (): void {
    // ...
  }
};
