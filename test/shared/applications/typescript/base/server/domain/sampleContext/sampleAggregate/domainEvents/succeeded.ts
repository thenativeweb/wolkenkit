import { SampleState } from '../SampleState';
// @ts-ignore
import { DomainEventData, DomainEventHandler } from 'wolkenkit';

/* eslint-disable @typescript-eslint/no-empty-interface */
export interface SucceededData extends DomainEventData {}
/* eslint-enable @typescript-eslint/no-empty-interface */

export const succeeded: DomainEventHandler<SampleState, SucceededData> = {
  isAuthorized (): boolean {
    return true;
  },

  handle (state: any): Partial<SampleState> {
    return {
      domainEventNames: [ ...state.domainEventNames, 'succeeded' ]
    };
  }
};
