import { SampleState } from '../SampleState';
import { DomainEventData, DomainEventHandler } from 'wolkenkit';

export interface SucceededData extends DomainEventData {}

export const succeeded: DomainEventHandler<SampleState, SucceededData> = {
  handle (state: any): Partial<SampleState> {
    return {
      domainEventNames: [ ...state.domainEventNames, 'succeeded' ]
    };
  },

  isAuthorized (): boolean {
    return true;
  }
};
