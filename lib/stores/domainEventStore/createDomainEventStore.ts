import { DomainEventStore } from './DomainEventStore';
import { errors } from '../../common/errors';
import { InMemoryDomainEventStore } from './InMemory';
import { MariaDbDomainEventStore } from './MariaDb';
import { MongoDbDomainEventStore } from './MongoDb';
import { MySqlDomainEventStore } from './MySql';
import { PostgresDomainEventStore } from './Postgres';
import { SqlServerDomainEventStore } from './SqlServer';

const createDomainEventStore = async function ({ type, options }: {
  type: string;
  options: any;
}): Promise<DomainEventStore> {
  switch (type) {
    case 'InMemory': {
      return InMemoryDomainEventStore.create();
    }
    case 'MariaDb': {
      return MariaDbDomainEventStore.create(options);
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
