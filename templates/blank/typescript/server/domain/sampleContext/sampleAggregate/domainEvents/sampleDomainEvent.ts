import { SampleState } from '../SampleState';
import { DomainEventData, DomainEventHandler, Schema } from 'wolkenkit';

export interface SampleDomainEventData extends DomainEventData {}

export const sampleDomainEvent: DomainEventHandler<SampleState, SampleDomainEventData> = {
  getSchema (): Schema {
    return {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false
    };
  },

  handle (state): Partial<SampleState> {
    return {
      domainEventNames: [ ...state.domainEventNames, 'sampleDomainEvent' ]
    };
  },

  isAuthorized (): boolean {
    return true;
  }
};
