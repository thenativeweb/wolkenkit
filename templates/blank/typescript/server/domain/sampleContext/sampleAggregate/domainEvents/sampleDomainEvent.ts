import { SampleState } from '../SampleState';
import { AskInfrastructure, DomainEventData, DomainEventHandler, Schema, TellInfrastructure } from 'wolkenkit';

export interface SampleDomainEventData extends DomainEventData {}

export const sampleDomainEvent: DomainEventHandler<SampleState, SampleDomainEventData, AskInfrastructure & TellInfrastructure> = {
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
