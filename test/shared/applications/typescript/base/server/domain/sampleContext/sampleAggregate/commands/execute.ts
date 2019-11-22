import { SampleState } from '../SampleState';
// @ts-ignore
import { CommandData, CommandHandler, Schema } from 'wolkenkit';

export interface ExecuteData extends CommandData {
  strategy: 'succeed' | 'fail' | 'reject';
}

export const execute: CommandHandler<SampleState, ExecuteData> = {
  getSchema (): Schema {
    return {
      type: 'object',
      properties: {
        strategy: { type: 'string', enum: [ 'succeed', 'fail', 'reject' ]}
      },
      required: [ 'strategy' ],
      additionalProperties: false
    };
  },

  isAuthorized (): boolean {
    return true;
  },

  handle (state: any, command: any, { aggregate }: { aggregate: any }): void {
    const { strategy } = command.data;

    if (strategy === 'fail') {
      throw new Error('Intentionally failed execute.');
    }

    if (strategy === 'reject') {
      // Uncomment: throw new errors.CommandRejected('Intentionally rejected execute.');
      throw new Error('Intentionally rejected execute.');
    }

    aggregate.publishDomainEvent('succeeded', {});
    aggregate.publishDomainEvent('executed', { strategy });
  }
};
