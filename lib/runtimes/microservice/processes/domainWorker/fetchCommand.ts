import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { Configuration } from './Configuration';

const fetchCommand = async function ({ configuration }: {
  configuration: Configuration;
}): Promise<CommandWithMetadata<CommandData>> {
  return {} as any;
};

export {
  fetchCommand
};
