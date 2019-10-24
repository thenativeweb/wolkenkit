import { AggregateIdentifier } from './AggregateIdentifier';
import { CommandData } from './CommandData';
import { ContextIdentifier } from './ContextIdentifier';

class Command<TCommandData extends CommandData> {
  public readonly contextIdentifier: ContextIdentifier;

  public readonly aggregateIdentifier: AggregateIdentifier;

  public readonly name: string;

  public readonly data: TCommandData;

  public constructor ({
    contextIdentifier,
    aggregateIdentifier,
    name,
    data
  }: {
    contextIdentifier: ContextIdentifier;
    aggregateIdentifier: AggregateIdentifier;
    name: string;
    data: TCommandData;
  }) {
    this.contextIdentifier = contextIdentifier;
    this.aggregateIdentifier = aggregateIdentifier;
    this.name = name;
    this.data = data;
  }
}

export { Command };
