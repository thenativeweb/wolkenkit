import { acknowledgeCommand } from './acknowledgeCommand';
import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { Configuration } from './Configuration';
import { fetchCommand } from './fetchCommand';
import { flaschenpost } from 'flaschenpost';
import { handleCommand } from '../../../../common/domain/handleCommand';
import { Repository } from '../../../../common/domain/Repository';

const logger = flaschenpost.getLogger();

const processCommand = async function ({
  configuration,
  applicationDefinition,
  repository
}: {
  configuration: Configuration;
  applicationDefinition: ApplicationDefinition;
  repository: Repository;
}): Promise<void> {
  try {
    const command = await fetchCommand({ configuration });

    await handleCommand({ command, applicationDefinition, repository });
    await acknowledgeCommand({ command, configuration });
  } catch (ex) {
    switch (ex.code) {
      case 'EFETCHCOMMANDFAILED': {
        logger.warn('Failed to fetch command from dispatcher.', { message: ex.message });
        break;
      }
      default: {
        throw ex;
      }
    }
  }
};

export {
  processCommand
};
