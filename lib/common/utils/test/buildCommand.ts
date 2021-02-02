import { AggregateIdentifier } from '../../elements/AggregateIdentifier';
import { Command } from '../../elements/Command';
import { CommandData } from '../../elements/CommandData';

const buildCommand = function <TCommandData extends CommandData> ({
  aggregateIdentifier,
  name,
  data
}: {
  aggregateIdentifier: AggregateIdentifier;
  name: string;
  data: TCommandData;
}): Command<TCommandData> {
  return new Command({
    aggregateIdentifier,
    name,
    data
  });
};

export { buildCommand };
