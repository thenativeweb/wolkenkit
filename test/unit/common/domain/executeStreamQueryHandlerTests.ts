import { Application } from '../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { ClientService } from '../../../../lib/common/services/ClientService';
import { CustomError } from 'defekt';
import { errors } from '../../../../lib/common/errors';
import { executeStreamQueryHandler } from '../../../../lib/common/domain/executeStreamQueryHandler';
import { getClientService } from '../../../../lib/common/services/getClientService';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { v4 } from 'uuid';
import { PassThrough, pipeline } from 'stream';

suite('executeStreamQueryHandler', (): void => {
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
      await executeStreamQueryHandler({
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
      await executeStreamQueryHandler({
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

  test('throws an exception if the query handler matches a value query, not a stream query.', async (): Promise<void> => {
    const queryHandlerIdentifier = {
      view: { name: 'sampleView' },
      name: 'first'
    };

    await assert.that(async (): Promise<void> => {
      await executeStreamQueryHandler({
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
      name: 'streamWithOptions'
    };

    const domainEvents = [
      {
        aggregateIdentifier: {
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: v4() }
        },
        name: 'executed',
        id: v4()
      },
      {
        aggregateIdentifier: {
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: v4() }
        },
        name: 'not-executed',
        id: v4()
      }
    ];

    (application.infrastructure.ask as any).viewStore.domainEvents = domainEvents;

    await assert.that(async (): Promise<void> => {
      await executeStreamQueryHandler({
        application,
        queryHandlerIdentifier,
        services: { client: clientService },
        options: {}
      });
    }).is.throwingAsync(
      (ex): boolean => (ex as CustomError).code === errors.QueryOptionsInvalid.code
    );
  });

  test('streams the result items.', async (): Promise<void> => {
    const queryHandlerIdentifier = {
      view: { name: 'sampleView' },
      name: 'all'
    };

    const domainEvents = [
      {
        aggregateIdentifier: {
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: v4() }
        },
        name: 'executed',
        id: v4()
      },
      {
        aggregateIdentifier: {
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: v4() }
        },
        name: 'executed',
        id: v4()
      }
    ];

    (application.infrastructure.ask as any).viewStore.domainEvents = domainEvents;

    const queryResultStream = await executeStreamQueryHandler({
      application,
      queryHandlerIdentifier,
      services: { client: clientService },
      options: {}
    });

    const resultViewItems = [];

    for await (const item of queryResultStream) {
      resultViewItems.push(item);
    }

    assert.that(resultViewItems).is.equalTo(domainEvents);
  });

  test('streams the result items and omits items that do not match the item schema.', async (): Promise<void> => {
    const queryHandlerIdentifier = {
      view: { name: 'sampleView' },
      name: 'all'
    };

    const domainEvents = [
      {
        aggregateIdentifier: {
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: v4() }
        },
        name: 'executed',
        id: v4()
      },
      {
        foo: 'bar'
      }
    ];

    (application.infrastructure.ask as any).viewStore.domainEvents = domainEvents;

    const queryResultStream = await executeStreamQueryHandler({
      application,
      queryHandlerIdentifier,
      services: { client: clientService },
      options: {}
    });
    const passThrough = new PassThrough({ objectMode: true });

    pipeline(
      queryResultStream,
      passThrough,
      async (): Promise<void> => {
        // Intentionally left blank.
      }
    );

    const resultViewItems = [];

    for await (const item of queryResultStream) {
      resultViewItems.push(item);
    }

    assert.that(resultViewItems).is.equalTo([ domainEvents[0] ]);
  });

  test('streams the result items and omits unauthorized items.', async (): Promise<void> => {
    const queryHandlerIdentifier = {
      view: { name: 'sampleView' },
      name: 'streamAuthorized'
    };

    const domainEvents = [
      {
        aggregateIdentifier: {
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: v4() }
        },
        name: 'executed',
        id: v4()
      },
      {
        aggregateIdentifier: {
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: v4() }
        },
        name: 'executed',
        id: v4()
      }
    ];

    (application.infrastructure.ask as any).viewStore.domainEvents = domainEvents;

    const queryResultStream = await executeStreamQueryHandler({
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

    const resultViewItems = [];

    for await (const item of queryResultStream) {
      resultViewItems.push(item);
    }

    assert.that(resultViewItems).is.equalTo([]);
  });

  test('streams the result items and respects the given options.', async (): Promise<void> => {
    const queryHandlerIdentifier = {
      view: { name: 'sampleView' },
      name: 'streamWithOptions'
    };

    const domainEvents = [
      {
        aggregateIdentifier: {
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: v4() }
        },
        name: 'executed',
        id: v4()
      },
      {
        aggregateIdentifier: {
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: v4() }
        },
        name: 'not-executed',
        id: v4()
      }
    ];

    (application.infrastructure.ask as any).viewStore.domainEvents = domainEvents;

    const queryResultStream = await executeStreamQueryHandler({
      application,
      queryHandlerIdentifier,
      services: { client: clientService },
      options: { filter: { domainEventName: 'executed' }}
    });

    const resultViewItems = [];

    for await (const item of queryResultStream) {
      resultViewItems.push(item);
    }

    assert.that(resultViewItems).is.equalTo([ domainEvents[0] ]);
  });
});
