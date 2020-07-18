// @ts-ignore
import { AskInfrastructure, DomainEvent, DomainEventData, TellInfrastructure } from 'wolkenkit';

export interface Infrastructure extends AskInfrastructure, TellInfrastructure {
  ask: {
    viewStore: {
      domainEvents: DomainEvent<DomainEventData>[];
    }
  };
  tell: {
    viewStore: {
      domainEvents: DomainEvent<DomainEventData>[];
    }
  };
}

const setupInfrastructure = async function (): Promise<void> {
  // Intentionally left blank.
};

const getInfrastructure = async function (): Promise<AskInfrastructure & TellInfrastructure> {
  const domainEvents: DomainEvent<DomainEventData>[] = [];

  return {
    ask: {
      viewStore: {
        domainEvents
      }
    },
    tell: {
      viewStore: {
        domainEvents
      }
    }
  };
};

export default { getInfrastructure, setupInfrastructure };
