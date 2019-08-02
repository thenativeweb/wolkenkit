import AggregateApiForReadOnly from './AggregateApiForReadOnly';
import { State } from './types/State';

class AggregateApiForEvents extends AggregateApiForReadOnly {
  public setState (newState: State): void {
    for (const [ key, value ] of Object.entries(newState)) {
      this.state[key] = value;
    }
  }
}

export default AggregateApiForEvents;
