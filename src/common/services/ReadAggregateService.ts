import AggregateApiForReadOnly from '../elements/AggregateApiForReadOnly';

export interface ReadAggregateService {
  [contextName: string]: {
    [aggregateName: string]: ((aggregateId: string) => {
      read: () => Promise<AggregateApiForReadOnly>;
    }) | undefined;
  } | undefined;
};
