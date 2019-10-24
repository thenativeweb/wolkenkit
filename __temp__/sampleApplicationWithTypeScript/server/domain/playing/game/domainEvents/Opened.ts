import { DomainEvent } from '../../../../../../../lib/common/elements/DomainEvent';
import { DomainEventHandler } from '../../../../../../../lib/common/elements/DomainEventHandler';
import { Schema } from '../../../../../../../lib/common/elements/Schema';
import { State } from '../State';

export interface Opened {
  level: number;
  riddle: string;
}

export const handler: DomainEventHandler<State, Opened> = {
  getDocumentation (): string {
    return `
      # A game was opened

      A new instance of the never completed game was opened.

      ## Examples

      Valid examples of this event look like ...
    `;
  },

  getSchema (): Schema {
    return {
      type: 'object',
      properties: {
        level: {
          title: 'The level.',
          description: 'The level the game was opened with.',
          type: 'number'
        },
        riddle: {
          title: 'The riddle.',
          description: 'The riddle the game was opened with.',
          type: 'string'
        }
      },
      required: [ 'level', 'riddle' ],
      additionalProperties: false
    };
  },

  handle (state, domainEvent): Partial<State> {
    return {
      level: domainEvent.data.level
    };
  },

  isAuthorized (): boolean {
    return true;
  },

  filter (): boolean {
    return true;
  },

  map (state, domainEvent): DomainEvent<Opened> {
    return domainEvent;
  }
};
