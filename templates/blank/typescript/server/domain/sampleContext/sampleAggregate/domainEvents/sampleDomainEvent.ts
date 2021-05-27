import { Infrastructure } from '../../../../infrastructure';
import { SampleState } from '../SampleState';
import { ApiSchema, DomainEventData, DomainEventHandler } from 'wolkenkit';

export type SampleDomainEventData = DomainEventData;

export const sampleDomainEvent: DomainEventHandler<SampleState, SampleDomainEventData, Infrastructure> = {
  getSchema (): ApiSchema {
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
