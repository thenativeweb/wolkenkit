import { DomainEventDispatcher } from './DomainEventDispatcher';
import { retry } from 'retry-ignore-abort';

const acknowledgeDomainEvent = async function ({ flowName, token, domainEventDispatcher }: {
  flowName: string;
  token: string;
  domainEventDispatcher: DomainEventDispatcher;
}): Promise<void> {
  await retry(async (): Promise<void> => {
    await domainEventDispatcher.client.acknowledge({
      discriminator: flowName,
      token
    });
  }, { retries: domainEventDispatcher.acknowledgeRetries, maxTimeout: 1000 });
};

export {
  acknowledgeDomainEvent
};
