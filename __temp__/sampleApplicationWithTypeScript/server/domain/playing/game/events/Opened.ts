import { State } from '../State';
import { Event, EventHandler, Schema } from '../../../../../elements';

export interface Opened {
  level: number;
  riddle: string;
}

export class Handler extends EventHandler<State, Opened> {
  /* eslint-disable class-methods-use-this */
  public getDocumentation (): string {
    return `
      # A game was opened

      A new instance of the never completed game was opened.

      ## Examples

      Valid examples of this event look like ...
    `;
  }
  /* eslint-enable class-methods-use-this */

  /* eslint-disable class-methods-use-this */
  public getSchema (): Schema {
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
  }
  /* eslint-enable class-methods-use-this */

  /* eslint-disable class-methods-use-this */
  public handle (state: State, event: Event<Opened>): Partial<State> {
    return {
      level: event.data.level
    };
  }
  /* eslint-enable class-methods-use-this */

  /* eslint-disable class-methods-use-this */
  public isAuthorized (): boolean {
    return true;
  }
  /* eslint-enable class-methods-use-this */

  /* eslint-disable class-methods-use-this */
  public filter (): boolean {
    return true;
  }
  /* eslint-enable class-methods-use-this */

  /* eslint-disable class-methods-use-this */
  public map (state: State, event: Event<Opened>): Event<Opened> {
    return event;
  }
  /* eslint-enable class-methods-use-this */
}
