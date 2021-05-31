import { Infrastructure } from '../../../../infrastructure';
import { SampleState } from '../SampleState';
import { ApiSchema, CommandData, CommandHandler } from 'wolkenkit';

export type SampleCommandData = CommandData;

export const sampleCommand: CommandHandler<SampleState, SampleCommandData, Infrastructure> = {
  getSchema (): ApiSchema {
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
