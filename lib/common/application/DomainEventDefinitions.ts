import { DomainEventData } from '../elements/DomainEventData';
import { DomainEventHandler } from '../elements/DomainEventHandler';
import { State } from '../elements/State';

export type DomainEventDefinitions = Record<string, Record<string, Record<string, DomainEventHandler<State, DomainEventData>>>>;
