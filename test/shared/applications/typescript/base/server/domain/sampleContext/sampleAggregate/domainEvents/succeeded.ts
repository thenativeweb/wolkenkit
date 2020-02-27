import { SampleState } from '../SampleState';
// @ts-ignore
import { DomainEventData, DomainEventHandler, Schema } from 'wolkenkit';

/* eslint-disable @typescript-eslint/no-empty-interface */
export interface SucceededData extends DomainEventData {}
/* eslint-enable @typescript-eslint/no-empty-interface */

export const succeeded: DomainEventHandler<SampleState, SucceededData> = {
  getSchema (): Schema {
    return {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false
    };
  },

  handle (state: any): Partial<SampleState> {
    return {
      domainEventNames: [ ...state.domainEventNames, 'succeeded' ]
    };
  },

  isAuthorized (): boolean {
    return true;
  }
};
