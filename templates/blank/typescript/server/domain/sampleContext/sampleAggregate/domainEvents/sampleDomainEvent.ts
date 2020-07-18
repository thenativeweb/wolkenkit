import { Infrastructure } from '../../../../infrastructure';
import { SampleState } from '../SampleState';
import { DomainEventData, DomainEventHandler, Schema } from 'wolkenkit';

export type SampleDomainEventData = DomainEventData;

export const sampleDomainEvent: DomainEventHandler<SampleState, SampleDomainEventData, Infrastructure> = {
  getSchema (): Schema {
    return {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false
    };
  },

  handle (): Partial<SampleState> {
    return {
      // ...
    };
  },

  isAuthorized (): boolean {
    return true;
  }
};
