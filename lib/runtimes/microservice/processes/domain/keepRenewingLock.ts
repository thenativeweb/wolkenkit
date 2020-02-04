import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { Dispatcher } from './Dispatcher';
import { getPromiseStatus } from '../../../../common/utils/getPromiseStatus';
import { sleep } from '../../../../common/utils/sleep';

const keepRenewingLock = async function ({ command, handleCommandPromise, dispatcher, token }: {
  command: CommandWithMetadata<CommandData>;
  handleCommandPromise: Promise<void>;
  dispatcher: Dispatcher;
  token: string;
}): Promise<void> {
  // eslint-disable-next-line no-constant-condition, @typescript-eslint/no-unnecessary-condition
  while (true) {
    await sleep({ ms: dispatcher.renewalInterval });

    if (await getPromiseStatus(handleCommandPromise) !== 'pending') {
      break;
    }

    await dispatcher.client.renewLock({
      itemIdentifier: command.getItemIdentifier(),
      token
    });
  }
};

export { keepRenewingLock };
