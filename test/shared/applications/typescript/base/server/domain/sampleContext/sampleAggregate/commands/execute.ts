import { SampleState } from '../SampleState';
// @ts-ignore
import { AggregateService, CommandData, CommandHandler, ErrorService, Schema } from 'wolkenkit';

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

  handle (state: any, command: any, { aggregate, error }: { aggregate: AggregateService<SampleState>; error: ErrorService }): void {
    const { strategy } = command.data;

    if (strategy === 'fail') {
      throw new Error('Intentionally failed execute.');
    }

    if (strategy === 'reject') {
      throw new error.CommandRejected('Intentionally rejected execute.');
    }

    aggregate.publishDomainEvent('succeeded', {});
    aggregate.publishDomainEvent('executed', { strategy });
  }
};
