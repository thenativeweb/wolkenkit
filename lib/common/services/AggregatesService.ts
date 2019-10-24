import { State } from '../elements/State';

export interface AggregatesService {
  [contextName: string]: {
    [aggregateName: string]: ((aggregateId: string) => {
      read: <TState extends State> () => Promise<TState>;
    }) | undefined;
  } | undefined;
}
