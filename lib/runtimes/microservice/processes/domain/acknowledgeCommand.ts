import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { Configuration } from './Configuration';

const acknowledgeCommand = async function ({ command, configuration }: {
  command: CommandWithMetadata<CommandData>;
  configuration: Configuration;
}): Promise<void> {

};

export {
  acknowledgeCommand
};
