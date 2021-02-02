import { CommandData } from '../../../../common/elements/CommandData';
import { CommandDispatcher } from './CommandDispatcher';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { getPromiseStatus } from '../../../../common/utils/getPromiseStatus';
import { sleep } from '../../../../common/utils/sleep';

const keepRenewingLock = async function ({ command, handleCommandPromise, commandDispatcher, token }: {
  command: CommandWithMetadata<CommandData>;
  handleCommandPromise: Promise<any>;
  commandDispatcher: CommandDispatcher;
  token: string;
}): Promise<void> {
  // eslint-disable-next-line no-constant-condition, @typescript-eslint/no-unnecessary-condition
  while (true) {
    await sleep({ ms: commandDispatcher.renewalInterval });

    if (await getPromiseStatus(handleCommandPromise) !== 'pending') {
      break;
    }

    await commandDispatcher.client.renewLock({
      discriminator: command.aggregateIdentifier.aggregate.id,
      token
    });
  }
};

export { keepRenewingLock };
