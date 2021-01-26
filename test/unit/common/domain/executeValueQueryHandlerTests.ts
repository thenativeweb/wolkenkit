import { Application } from '../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { ClientService } from '../../../../lib/common/services/ClientService';
import { CustomError } from 'defekt';
import { errors } from '../../../../lib/common/errors';
import { executeValueQueryHandler } from '../../../../lib/common/domain/executeValueQueryHandler';
import { getClientService } from '../../../../lib/common/services/getClientService';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { v4 } from 'uuid';

suite('executeValueQueryHandler', (): void => {
  let application: Application,
      clientService: ClientService;

  setup(async (): Promise<void> => {
    const applicationDirectory = getTestApplicationDirectory({ name: 'withComplexQueries', language: 'javascript' });

    application = await loadApplication({ applicationDirectory });

    clientService = getClientService({ clientMetadata: {
      ip: '127.0.0.1',
      user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
      token: '...'
    }});
  });

  test('throws an exception if the view name does not exist.', async (): Promise<void> => {
    const queryHandlerIdentifier = {
      view: { name: 'someView' },
      name: 'all'
    };

    await assert.that(async (): Promise<void> => {
      await executeValueQueryHandler({
        application,
        queryHandlerIdentifier,
        services: {
          client: clientService
        },
        options: {}
      });
    }).is.throwingAsync(
      (ex): boolean => (ex as CustomError).code === errors.ViewNotFound.code
    );
  });

  test('throws an exception if the query handler name does not exist.', async (): Promise<void> => {
    const queryHandlerIdentifier = {
      view: { name: 'sampleView' },
      name: 'someQueryHandler'
    };

    await assert.that(async (): Promise<void> => {
      await executeValueQueryHandler({
        application,
        queryHandlerIdentifier,
        services: {
          client: clientService
        },
        options: {}
      });
    }).is.throwingAsync(
      (ex): boolean => (ex as CustomError).code === errors.QueryHandlerNotFound.code
    );
  });

  test('throws an exception if the query handler matches a stream query, not a value query.', async (): Promise<void> => {
    const queryHandlerIdentifier = {
      view: { name: 'sampleView' },
      name: 'all'
    };

    await assert.that(async (): Promise<void> => {
      await executeValueQueryHandler({
        application,
        queryHandlerIdentifier,
        services: {
          client: clientService
        },
        options: {}
      });
    }).is.throwingAsync(
      (ex): boolean => (ex as CustomError).code === errors.QueryHandlerTypeMismatch.code
    );
  });

  test('throws an exception if the options do not match the options schema.', async (): Promise<void> => {
    const queryHandlerIdentifier = {
      view: { name: 'sampleView' },
      name: 'valueWithOptions'
    };

    const domainEvents = [
      {
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
        name: 'executed',
        id: v4()
      },
      {
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
        name: 'not-executed',
        id: v4()
      }
    ];

    (application.infrastructure.ask as any).viewStore.domainEvents = domainEvents;

    await assert.that(async (): Promise<void> => {
      await executeValueQueryHandler({
        application,
        queryHandlerIdentifier,
        services: { client: clientService },
        options: {}
      });
    }).is.throwingAsync(
      (ex): boolean => (ex as CustomError).code === errors.QueryOptionsInvalid.code
    );
  });

  test('returns the result item.', async (): Promise<void> => {
    const queryHandlerIdentifier = {
      view: { name: 'sampleView' },
      name: 'first'
    };

    const domainEvents = [
      {
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
        name: 'executed',
        id: v4()
      },
      {
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
        name: 'executed',
        id: v4()
      }
    ];

    (application.infrastructure.ask as any).viewStore.domainEvents = domainEvents;

    const queryResultItem = await executeValueQueryHandler({
      application,
      queryHandlerIdentifier,
      services: { client: clientService },
      options: {}
    });

    assert.that(queryResultItem).is.equalTo(domainEvents[0]);
  });

  test('throws an exception if the query handler throws a NotFound exception.', async (): Promise<void> => {
    const queryHandlerIdentifier = {
      view: { name: 'sampleView' },
      name: 'notFound'
    };

    (application.infrastructure.ask as any).viewStore.domainEvents = [];

    await assert.that(async (): Promise<void> => {
      await executeValueQueryHandler({
        application,
        queryHandlerIdentifier,
        services: { client: clientService },
        options: {}
      });
    }).is.throwingAsync<CustomError>(
      (ex): boolean => ex.code === errors.NotFound.code
    );
  });

  test('throws an exception if the result item does not match the schema.', async (): Promise<void> => {
    const queryHandlerIdentifier = {
      view: { name: 'sampleView' },
      name: 'first'
    };

    const domainEvents = [
      {
        foo: 'bar'
      }
    ];

    (application.infrastructure.ask as any).viewStore.domainEvents = domainEvents;

    await assert.that(async (): Promise<void> => {
      await executeValueQueryHandler({
        application,
        queryHandlerIdentifier,
        services: { client: clientService },
        options: {}
      });
    }).is.throwingAsync<CustomError>(
      (ex): boolean => ex.code === errors.QueryResultInvalid.code
    );
  });

  test('throws an exception if the query is not authorized.', async (): Promise<void> => {
    const queryHandlerIdentifier = {
      view: { name: 'sampleView' },
      name: 'valueAuthorized'
    };

    const domainEvents = [
      {
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
        name: 'executed',
        id: v4()
      },
      {
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
        name: 'executed',
        id: v4()
      }
    ];

    (application.infrastructure.ask as any).viewStore.domainEvents = domainEvents;

    await assert.that(async (): Promise<void> => {
      await executeValueQueryHandler({
        application,
        queryHandlerIdentifier,
        services: { client: {
          ...clientService,
          user: {
            ...clientService.user,
            id: 'not.jane.doe'
          }
        }},
        options: {}
      });
    }).is.throwingAsync<CustomError>(
      (ex): boolean => ex.code === errors.QueryNotAuthorized.code
    );
  });

  test('returns the result item and respects the given options.', async (): Promise<void> => {
    const queryHandlerIdentifier = {
      view: { name: 'sampleView' },
      name: 'valueWithOptions'
    };

    const domainEvents = [
      {
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
        name: 'executed',
        id: v4()
      },
      {
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
        name: 'not-executed',
        id: v4()
      }
    ];

    (application.infrastructure.ask as any).viewStore.domainEvents = domainEvents;

    const queryResultItem = await executeValueQueryHandler({
      application,
      queryHandlerIdentifier,
      services: { client: clientService },
      options: { filter: { domainEventName: 'executed' }}
    });

    assert.that(queryResultItem).is.equalTo(domainEvents[0]);
  });
});
