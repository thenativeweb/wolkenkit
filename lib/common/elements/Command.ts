import { AggregateIdentifier } from './AggregateIdentifier';
import { CommandData } from './CommandData';

class Command<TCommandData extends CommandData> {
  public readonly aggregateIdentifier: AggregateIdentifier;

  public readonly name: string;

  public readonly data: TCommandData;

  public constructor ({
    aggregateIdentifier,
    name,
    data
  }: {
    aggregateIdentifier: AggregateIdentifier;
    name: string;
    data: TCommandData;
  }) {
    this.aggregateIdentifier = aggregateIdentifier;
    this.name = name;
    this.data = data;
  }
}

export { Command };
