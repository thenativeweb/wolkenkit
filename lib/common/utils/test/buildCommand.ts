import { AggregateIdentifier } from '../../elements/AggregateIdentifier';
import { Command } from '../../elements/Command';
import { CommandData } from '../../elements/CommandData';
import { ContextIdentifier } from '../../elements/ContextIdentifier';

const buildCommand = function <TCommandData extends CommandData> ({
  contextIdentifier,
  aggregateIdentifier,
  name,
  data
}: {
  contextIdentifier: ContextIdentifier;
  aggregateIdentifier: AggregateIdentifier;
  name: string;
  data: TCommandData;
}): Command<TCommandData> {
  return new Command({
    contextIdentifier,
    aggregateIdentifier,
    name,
    data
  });
};

export { buildCommand };
