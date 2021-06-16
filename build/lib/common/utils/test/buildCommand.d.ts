import { AggregateIdentifier } from '../../elements/AggregateIdentifier';
import { Command } from '../../elements/Command';
declare const buildCommand: <TCommandData extends object>({ aggregateIdentifier, name, data }: {
    aggregateIdentifier: AggregateIdentifier;
    name: string;
    data: TCommandData;
}) => Command<TCommandData>;
export { buildCommand };
