import AggregateApiForReadOnly from '../elements/AggregateApiForReadOnly';

export interface AggregateService {
  [contextName: string]: {
    [aggregateName: string]: ((aggregateId: string) => {
      read: () => Promise<AggregateApiForReadOnly>;
    }) | undefined;
  } | undefined;
};
