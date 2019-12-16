import { CommandData } from '../../common/elements/CommandData';
import { CommandWithMetadata } from '../../common/elements/CommandWithMetadata';
import { DomainEvent } from '../../common/elements/DomainEvent';
import { DomainEventData } from '../../common/elements/DomainEventData';
import { errors } from '../../common/errors';
import { InMemoryPriorityQueueStore } from './InMemory';
import { PriorityQueueStore } from './PriorityQueueStore';

const createPriorityQueueStore = async function<TItem extends CommandWithMetadata<CommandData> | DomainEvent<DomainEventData>> ({ type, options }: {
  type: string;
  options: any;
}): Promise<PriorityQueueStore<TItem>> {
  switch (type) {
    case 'InMemory': {
      return await InMemoryPriorityQueueStore.create(options);
    }
    default: {
      throw new errors.DatabaseTypeInvalid();
    }
  }
};

export { createPriorityQueueStore };
