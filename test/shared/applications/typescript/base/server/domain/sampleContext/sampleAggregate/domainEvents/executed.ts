import { Infrastructure } from '../../../../infrastructure';
import { SampleState } from '../SampleState';
// @ts-ignore
import { ApiSchema, DomainEventData, DomainEventHandler } from 'wolkenkit';

export interface ExecutedData extends DomainEventData {
  strategy: 'succeed' | 'fail' | 'reject';
}

export const executed: DomainEventHandler<SampleState, ExecutedData, Infrastructure> = {
  getSchema (): ApiSchema {
    return {
      type: 'object',
      properties: {
        strategy: { type: 'string', enum: [ 'succeed', 'fail', 'reject' ]}
      },
      required: [ 'strategy' ],
      additionalProperties: false
    };
  },

  handle (state: any): Partial<SampleState> {
    return {
      domainEventNames: [ ...state.domainEventNames, 'executed' ]
    };
  },

  isAuthorized (): boolean {
    return true;
  }
};
