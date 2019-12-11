import { CommandData } from '../../common/elements/CommandData';
import { CommandWithMetadata } from '../../common/elements/CommandWithMetadata';
import { DomainEvent } from '../../common/elements/DomainEvent';
import { DomainEventData } from '../../common/elements/DomainEventData';
import { ItemIdentifier } from '../../common/elements/ItemIdentifier';

export interface PriorityQueueStore<TItem extends CommandWithMetadata<CommandData> | DomainEvent<DomainEventData>> {
  enqueue ({ item }: { item: TItem }): Promise<void>;

  lockNext (): Promise<{ item: TItem; token: string } | undefined>;

  renewLock ({ itemIdentifier, token }: {
    itemIdentifier: ItemIdentifier;
    token: string;
  }): Promise<void>;

  acknowledge ({ itemIdentifier, token }: {
    itemIdentifier: ItemIdentifier;
    token: string;
  }): Promise<void>;

  destroy (): Promise<void>;
}
