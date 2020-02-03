import { ApplicationDefinition } from '../application/ApplicationDefinition';
import { CommandData } from '../elements/CommandData';
import { CommandWithMetadata } from '../elements/CommandWithMetadata';
import { Repository } from './Repository';

const handleCommand = async function ({ command, applicationDefinition, repository }: {
  command: CommandWithMetadata<CommandData>;
  applicationDefinition: ApplicationDefinition;
  repository: Repository;
}): Promise<void> {

};

export {
  handleCommand
};
