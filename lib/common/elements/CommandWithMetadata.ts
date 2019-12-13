import { AggregateIdentifier } from './AggregateIdentifier';
import { Command } from './Command';
import { CommandData } from './CommandData';
import { CommandMetadata } from './CommandMetadata';
import { ContextIdentifier } from './ContextIdentifier';
import { ItemIdentifier } from './ItemIdentifier';

class CommandWithMetadata<TCommandData extends CommandData> extends Command<TCommandData> {
  public readonly id: string;

  public readonly metadata: CommandMetadata;

  public constructor ({
    contextIdentifier,
    aggregateIdentifier,
    name,
    data,
    id,
    metadata
  }: {
    contextIdentifier: ContextIdentifier;
    aggregateIdentifier: AggregateIdentifier;
    name: string;
    data: TCommandData;
    id: string;
    metadata: CommandMetadata;
  }) {
    super({ contextIdentifier, aggregateIdentifier, name, data });

    this.id = id;
    this.metadata = metadata;
  }

  public getItemIdentifier (): ItemIdentifier {
    return {
      contextIdentifier: this.contextIdentifier,
      aggregateIdentifier: this.aggregateIdentifier,
      name: this.name,
      id: this.id
    };
  }
}

export { CommandWithMetadata };
