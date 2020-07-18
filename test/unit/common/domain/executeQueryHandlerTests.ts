import { Application } from '../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { ClientService } from '../../../../lib/common/services/ClientService';
import { CustomError } from 'defekt';
import { executeQueryHandler } from '../../../../lib/common/domain/executeQueryHandler';
import { getClientService } from '../../../../lib/common/services/getClientService';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { uuid } from 'uuidv4';
import { waitForSignals } from 'wait-for-signals';
import { PassThrough, pipeline } from 'stream';

suite('executeQueryHandler', (): void => {
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

  test('throws an error if the view name does not exist.', async (): Promise<void> => {
    const queryHandlerIdentifier = {
      view: { name: 'someView' },
      name: 'all'
    };

    await assert.that(async (): Promise<void> => {
      await executeQueryHandler({
        application,
        queryHandlerIdentifier,
        services: {
          client: clientService
        },
        options: {}
      });
    }).is.throwingAsync(
      (ex): boolean => (ex as CustomError).code === 'EVIEWNOTFOUND'
    );
  });

  test('throws an error if the query handler name does not exist.', async (): Promise<void> => {
    const queryHandlerIdentifier = {
      view: { name: 'sampleView' },
      name: 'someQueryHandler'
    };

    await assert.that(async (): Promise<void> => {
      await executeQueryHandler({
        application,
        queryHandlerIdentifier,
        services: {
          client: clientService
        },
        options: {}
      });
    }).is.throwingAsync(
      (ex): boolean => (ex as CustomError).code === 'EQUERYHANDLERNOTFOUND'
    );
  });

  suite('stream query handler', (): void => {
    test('returns a stream of the result items.', async (): Promise<void> => {
      const queryHandlerIdentifier = {
        view: { name: 'sampleView' },
        name: 'all'
      };

      const domainEvents = [
        {
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'executed',
          id: uuid()
        },
        {
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'executed',
          id: uuid()
        }
      ];

      (application.infrastructure.ask as any).viewStore.domainEvents = domainEvents;

      const queryResultStream = await executeQueryHandler({
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

    test('throws an error if a result item does not match the schema.', async (): Promise<void> => {
      const queryHandlerIdentifier = {
        view: { name: 'sampleView' },
        name: 'all'
      };

      const domainEvents = [
        {
          foo: 'bar'
        }
      ];

      (application.infrastructure.ask as any).viewStore.domainEvents = domainEvents;

      const resultStream = await executeQueryHandler({
        application,
        queryHandlerIdentifier,
        services: { client: clientService },
        options: {}
      });
      const passThrough = new PassThrough({ objectMode: true });

      const counter = waitForSignals({ count: 1 });

      pipeline(
        resultStream,
        passThrough,
        async (err): Promise<void> => {
          assert.that(err).is.not.undefined();
          await counter.signal();
        }
      );

      await counter.promise;
    });

    test('respects isAuthorized.', async (): Promise<void> => {
      const queryHandlerIdentifier = {
        view: { name: 'sampleView' },
        name: 'authorized'
      };

      const domainEvents = [
        {
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'executed',
          id: uuid()
        },
        {
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'executed',
          id: uuid()
        }
      ];

      (application.infrastructure.ask as any).viewStore.domainEvents = domainEvents;

      const queryResultStream = await executeQueryHandler({
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

    test('respects options.', async (): Promise<void> => {
      const queryHandlerIdentifier = {
        view: { name: 'sampleView' },
        name: 'withOptions'
      };

      const domainEvents = [
        {
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'executed',
          id: uuid()
        },
        {
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'not-executed',
          id: uuid()
        }
      ];

      (application.infrastructure.ask as any).viewStore.domainEvents = domainEvents;

      const queryResultStream = await executeQueryHandler({
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

    test('throws an error if options do not match the options schema.', async (): Promise<void> => {
      const queryHandlerIdentifier = {
        view: { name: 'sampleView' },
        name: 'withOptions'
      };

      const domainEvents = [
        {
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'executed',
          id: uuid()
        },
        {
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'not-executed',
          id: uuid()
        }
      ];

      (application.infrastructure.ask as any).viewStore.domainEvents = domainEvents;

      await assert.that(async (): Promise<void> => {
        await executeQueryHandler({
          application,
          queryHandlerIdentifier,
          services: { client: clientService },
          options: {}
        });
      }).is.throwingAsync(
        (ex): boolean => (ex as CustomError).code === 'EQUERYOPTIONSINVALID'
      );
    });
  });

  suite('value query handler', (): void => {
    test('returns a stream containing the single result item.', async (): Promise<void> => {
      const queryHandlerIdentifier = {
        view: { name: 'sampleView' },
        name: 'first'
      };

      const domainEvents = [
        {
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'executed',
          id: uuid()
        },
        {
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'executed',
          id: uuid()
        }
      ];

      (application.infrastructure.ask as any).viewStore.domainEvents = domainEvents;

      const queryResultStream = await executeQueryHandler({
        application,
        queryHandlerIdentifier,
        services: { client: clientService },
        options: {}
      });

      const resultViewItems = [];

      for await (const item of queryResultStream) {
        resultViewItems.push(item);
      }

      assert.that(resultViewItems).is.equalTo([ domainEvents[0] ]);
    });

    test('throws an error if a result item does not match the schema.', async (): Promise<void> => {
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

      const resultStream = await executeQueryHandler({
        application,
        queryHandlerIdentifier,
        services: { client: clientService },
        options: {}
      });
      const passThrough = new PassThrough({ objectMode: true });

      const counter = waitForSignals({ count: 1 });

      pipeline(
        resultStream,
        passThrough,
        async (err): Promise<void> => {
          assert.that(err).is.not.undefined();
          await counter.signal();
        }
      );

      await counter.promise;
    });
  });
});
