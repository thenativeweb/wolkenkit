import { DomainEventStore } from './DomainEventStore';
import { DomainEventStoreOptions } from './DomainEventStoreOptions';
import { errors } from '../../common/errors';
import { InMemoryDomainEventStore } from './InMemory';
import { MongoDbDomainEventStore } from './MongoDb';
import { MySqlDomainEventStore } from './MySql';
import { PostgresDomainEventStore } from './Postgres';
import { SqlServerDomainEventStore } from './SqlServer';

const createDomainEventStore = async function (
  options: DomainEventStoreOptions
): Promise<DomainEventStore> {
  switch (options.type) {
    case 'InMemory': {
      return InMemoryDomainEventStore.create(options);
    }
    case 'MariaDb': {
      return MySqlDomainEventStore.create(options);
    }
    case 'MongoDb': {
      return MongoDbDomainEventStore.create(options);
    }
    case 'MySql': {
      return MySqlDomainEventStore.create(options);
    }
    case 'Postgres': {
      return PostgresDomainEventStore.create(options);
    }
    case 'SqlServer': {
      return SqlServerDomainEventStore.create(options);
    }
    default: {
      throw new errors.DatabaseTypeInvalid();
    }
  }
};

export { createDomainEventStore };
