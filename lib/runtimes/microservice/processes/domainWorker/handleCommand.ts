import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { Configuration } from './Configuration';
import { flaschenpost } from 'flaschenpost';
import { IdentityProvider } from 'limes';
import { Repository } from '../../../../common/domain/Repository';

const logger = flaschenpost.getLogger();

const handleCommand = async function ({
  configuration,
  applicationDefinition,
  repository,
  identityProviders
}: {
  configuration: Configuration;
  applicationDefinition: ApplicationDefinition;
  repository: Repository;
  identityProviders: IdentityProvider[];
}): Promise<void> {
  try {
    const command = await fetchCommandFromDispatcher({ configuration });

    await processCommand({ command, applicationDefinition, repository, identityProviders });
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
  handleCommand
};
