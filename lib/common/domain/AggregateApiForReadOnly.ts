import Aggregate from './Aggregate';

class AggregateApiForReadOnly<TState> {
  public readonly id: string;

  public readonly state: TState;

  protected aggregate: Aggregate<TState>;

  public constructor ({ aggregate }: {
    aggregate: Aggregate<TState>;
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
