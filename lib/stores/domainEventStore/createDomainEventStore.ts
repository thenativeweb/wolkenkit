import { DomainEventStore } from './DomainEventStore';
import { errors } from '../../common/errors';
import { InMemoryDomainEventStore, InMemoryDomainEventStoreOptions } from './InMemory';
import { MongoDbDomainEventStore, MongoDbDomainEventStoreOptions } from './MongoDb';
import { MySqlDomainEventStore, MySqlDomainEventStoreOptions } from './MySql';
import { PostgresDomainEventStore, PostgresDomainEventStoreOptions } from './Postgres';
import { SqlServerDomainEventStore, SqlServerDomainEventStoreOptions } from './SqlServer';

const createDomainEventStore = async function (
  options: InMemoryDomainEventStoreOptions | MongoDbDomainEventStoreOptions | MySqlDomainEventStoreOptions | PostgresDomainEventStoreOptions | SqlServerDomainEventStoreOptions
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
