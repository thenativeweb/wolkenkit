import { AggregateIdentifier } from './AggregateIdentifier';
import { CommandData } from './CommandData';
declare class Command<TCommandData extends CommandData> {
    readonly aggregateIdentifier: AggregateIdentifier;
    readonly name: string;
    readonly data: TCommandData;
    constructor({ aggregateIdentifier, name, data }: {
        aggregateIdentifier: AggregateIdentifier;
        name: string;
        data: TCommandData;
    });
}
export { Command };
