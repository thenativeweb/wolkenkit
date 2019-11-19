import { AggregateIdentifier } from '../../lib/common/elements/AggregateIdentifier';
import { Command } from '../../lib/common/elements/Command';
import { CommandData } from '../../lib/common/elements/CommandData';
import { ContextIdentifier } from '../../lib/common/elements/ContextIdentifier';

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
