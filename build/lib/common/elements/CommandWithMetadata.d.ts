import { AggregateIdentifier } from './AggregateIdentifier';
import { Command } from './Command';
import { CommandData } from './CommandData';
import { CommandMetadata } from './CommandMetadata';
import { ItemIdentifier } from './ItemIdentifier';
declare class CommandWithMetadata<TCommandData extends CommandData> extends Command<TCommandData> {
    readonly id: string;
    readonly metadata: CommandMetadata;
    constructor({ aggregateIdentifier, name, data, id, metadata }: {
        aggregateIdentifier: AggregateIdentifier;
        name: string;
        data: TCommandData;
        id: string;
        metadata: CommandMetadata;
    });
    getItemIdentifier(): ItemIdentifier;
}
export { CommandWithMetadata };
