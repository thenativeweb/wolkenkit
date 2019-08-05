import Aggregate from './Aggregate';
import { State } from './State';

class AggregateApiForReadOnly {
  protected aggregate: Aggregate;

  public readonly id: string;

  public state: State;

  public constructor ({ aggregate }: {
    aggregate: Aggregate;
  }) {
    this.aggregate = aggregate;
    this.id = aggregate.id;
    this.state = aggregate.state;
  }

  public exists (): boolean {
    return this.aggregate.exists();
  }
}

export default AggregateApiForReadOnly;
