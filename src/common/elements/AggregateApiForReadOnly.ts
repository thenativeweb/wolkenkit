import Aggregate from './Aggregate';
import { State } from './State';

class AggregateApiForReadOnly {
  public readonly id: string;

  public state: State;

  protected aggregate: Aggregate;

  public constructor ({ aggregate }: {
    aggregate: Aggregate;
  }) {
    this.aggregate = aggregate;
    this.id = aggregate.identifier.id;
    this.state = aggregate.state;
  }

  public exists (): boolean {
    return this.aggregate.exists();
  }
}

export default AggregateApiForReadOnly;
