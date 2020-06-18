export type DoesIdentifierMatchItem<TItem, TItemIdentifier> = ({ item, itemIdentifier }: {
  item: TItem;
  itemIdentifier: TItemIdentifier;
}) => boolean;
