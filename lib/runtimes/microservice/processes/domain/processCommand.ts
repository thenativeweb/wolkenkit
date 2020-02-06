import { acknowledgeCommand } from './acknowledgeCommand';
import { ApplicationDefinition } from '../../../../common/application/ApplicationDefinition';
import { Dispatcher } from './Dispatcher';
import { fetchCommand } from './fetchCommand';
import { flaschenpost } from 'flaschenpost';
import { handleCommand } from '../../../../common/domain/handleCommand';
import { keepRenewingLock } from './keepRenewingLock';
import { PublishDomainEvents } from '../../../../common/domain/PublishDomainEvents';
import { Repository } from '../../../../common/domain/Repository';

const logger = flaschenpost.getLogger();

const processCommand = async function ({
  dispatcher,
  applicationDefinition,
  repository,
  publishDomainEvents
}: {
  dispatcher: Dispatcher;
  applicationDefinition: ApplicationDefinition;
  repository: Repository;
  publishDomainEvents: PublishDomainEvents;
}): Promise<void> {
  const { command, token } = await fetchCommand({ dispatcher });

  try {
    const handleCommandPromise = handleCommand({
      command,
      applicationDefinition,
      repository,
      publishDomainEvents
    });

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async (): Promise<void> => {
      await keepRenewingLock({ command, handleCommandPromise, dispatcher, token });
    })();

    await handleCommandPromise;
  } catch (ex) {
    logger.error('Failed to handle command.', { command, ex });
  } finally {
    await acknowledgeCommand({ command, token, dispatcher });
  }
};

export { processCommand };
