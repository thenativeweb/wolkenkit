import { Application } from '../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { Client } from '../../../../lib/apis/queryView/http/v2/Client';
import { CustomError } from 'defekt';
import { errors } from '../../../../lib/common/errors';
import { Application as ExpressApplication } from 'express';
import { getApi } from '../../../../lib/apis/queryView/http';
import { getApplicationDescription } from '../../../../lib/common/application/getApplicationDescription';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { identityProvider } from '../../../shared/identityProvider';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { runAsServer } from '../../../shared/http/runAsServer';
import { v4 } from 'uuid';

suite('queryView/http/Client', (): void => {
  const identityProviders = [ identityProvider ];

  let application: Application;

  suite('/v2', (): void => {
    suiteSetup(async (): Promise<void> => {
      const applicationDirectory = getTestApplicationDirectory({ name: 'withComplexQueries' });

      application = await loadApplication({ applicationDirectory });
    });

    suite('getDescription', (): void => {
      let api: ExpressApplication;

      setup(async (): Promise<void> => {
        ({ api } = await getApi({
          corsOrigin: '*',
          application,
          identityProviders
        }));
      });

      test('returns the views description.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const description = await client.getDescription();

        const { views: viewsDescription } = getApplicationDescription({
          application
        });

        // Convert and parse as JSON, to get rid of any values that are undefined.
        // This is what the HTTP API does internally, and here we need to simulate
        // this to make things work.
        const expectedViewsDescription =
          JSON.parse(JSON.stringify(viewsDescription));

        assert.that(description).is.equalTo(expectedViewsDescription);
      });
    });

    suite('queryStream', (): void => {
      let api: ExpressApplication;

      setup(async (): Promise<void> => {
        ({ api } = await getApi({
          corsOrigin: '*',
          application,
          identityProviders
        }));
      });

      test('throws an exception if the view name does not exist.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.queryStream({ viewName: 'nonExistent', queryName: 'all' });
        }).is.throwingAsync(
          (ex): boolean =>
            (ex as CustomError).code === errors.ViewNotFound.code &&
          (ex as CustomError).message === `View 'nonExistent' not found.`
        );
      });

      test('throws an exception if the query handler name does not exist.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.queryStream({ viewName: 'sampleView', queryName: 'nonExistent' });
        }).is.throwingAsync(
          (ex): boolean =>
            (ex as CustomError).code === errors.QueryHandlerNotFound.code &&
          (ex as CustomError).message === `Query handler 'sampleView.nonExistent' not found.`
        );
      });

      test('throws an exception if the query handler matches a value query, not a stream query.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.queryStream({ viewName: 'sampleView', queryName: 'first' });
        }).is.throwingAsync(
          (ex): boolean =>
            (ex as CustomError).code === errors.QueryHandlerTypeMismatch.code
        );
      });

      test('throws an exception if the options do not match the options schema.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.queryStream({
            viewName: 'sampleView',
            queryName: 'streamWithOptions',
            queryOptions: { foo: 'bar' }
          });
        }).is.throwingAsync(
          (ex): boolean =>
            (ex as CustomError).code === errors.QueryOptionsInvalid.code &&
          (ex as CustomError).message === `Missing required property: filter (at queryHandlerOptions.filter).`
        );
      });

      test('streams the result items.', async (): Promise<void> => {
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

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const resultStream = await client.queryStream({
          viewName: 'sampleView',
          queryName: 'all'
        });
        const resultItems = [];

        for await (const resultItem of resultStream) {
          resultItems.push(resultItem);
        }

        assert.that(resultItems).is.equalTo(domainEvents);
      });

      test('streams the result items and omits items that do not match the item schema.', async (): Promise<void> => {
        const domainEvents = [
          {
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
            name: 'executed',
            id: v4()
          },
          {
            foo: 'bar'
          }
        ];

        (application.infrastructure.ask as any).viewStore.domainEvents = domainEvents;

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const resultStream = await client.queryStream({
          viewName: 'sampleView',
          queryName: 'all'
        });
        const resultItems = [];

        for await (const resultItem of resultStream) {
          resultItems.push(resultItem);
        }

        assert.that(resultItems).is.equalTo([ domainEvents[0] ]);
      });

      test('streams the result items and omits unauthorized items.', async (): Promise<void> => {
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

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const resultStream = await client.queryStream({
          viewName: 'sampleView',
          queryName: 'streamAuthorized'
        });
        const resultItems = [];

        for await (const resultItem of resultStream) {
          resultItems.push(resultItem);
        }

        assert.that(resultItems).is.equalTo([]);
      });

      test('streams the result items and respects the given options.', async (): Promise<void> => {
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

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const resultStream = await client.queryStream({
          viewName: 'sampleView',
          queryName: 'streamWithOptions',
          queryOptions: { filter: { domainEventName: 'executed' }}
        });
        const resultItems = [];

        for await (const resultItem of resultStream) {
          resultItems.push(resultItem);
        }

        assert.that(resultItems).is.equalTo([ domainEvents[0] ]);
      });
    });

    suite('queryValue', (): void => {
      let api: ExpressApplication;

      setup(async (): Promise<void> => {
        ({ api } = await getApi({
          corsOrigin: '*',
          application,
          identityProviders
        }));
      });

      test('throws an exception if the view name does not exist.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.queryValue({ viewName: 'nonExistent', queryName: 'first' });
        }).is.throwingAsync(
          (ex): boolean =>
            (ex as CustomError).code === errors.ViewNotFound.code &&
            (ex as CustomError).message === `View 'nonExistent' not found.`
        );
      });

      test('throws an exception if the query handler name does not exist.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.queryValue({ viewName: 'sampleView', queryName: 'nonExistent' });
        }).is.throwingAsync(
          (ex): boolean =>
            (ex as CustomError).code === errors.QueryHandlerNotFound.code &&
            (ex as CustomError).message === `Query handler 'sampleView.nonExistent' not found.`
        );
      });

      test('throws an exception if the query handler matches a stream query, not a value query.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.queryValue({ viewName: 'sampleView', queryName: 'all' });
        }).is.throwingAsync(
          (ex): boolean => (ex as CustomError).code === errors.QueryHandlerTypeMismatch.code
        );
      });

      test('throws an exception if the options do not match the options schema.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.queryValue({
            viewName: 'sampleView',
            queryName: 'valueWithOptions',
            queryOptions: { foo: 'bar' }
          });
        }).is.throwingAsync(
          (ex): boolean =>
            (ex as CustomError).code === errors.QueryOptionsInvalid.code &&
            (ex as CustomError).message === `Missing required property: filter (at queryHandlerOptions.filter).`
        );
      });

      test('returns the result item.', async (): Promise<void> => {
        const domainEvents = [
          {
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
            name: 'executed',
            id: v4()
          }
        ];

        (application.infrastructure.ask as any).viewStore.domainEvents = domainEvents;

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const queryResultItem = await client.queryValue({
          viewName: 'sampleView',
          queryName: 'first'
        });

        assert.that(queryResultItem).is.equalTo(domainEvents[0]);
      });

      test('throws an exception if the query does not return a result.', async (): Promise<void> => {
        (application.infrastructure.ask as any).viewStore.domainEvents = [];

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.queryValue({
            viewName: 'sampleView',
            queryName: 'notFound'
          });
        }).is.throwingAsync<CustomError>(
          (ex): boolean => ex.code === errors.NotFound.code
        );
      });

      test('throws an exception if the result item does not match the item schema.', async (): Promise<void> => {
        const domainEvents = [
          {
            foo: 'bar'
          }
        ];

        (application.infrastructure.ask as any).viewStore.domainEvents = domainEvents;

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.queryValue({
            viewName: 'sampleView',
            queryName: 'first'
          });
        }).is.throwingAsync<CustomError>(
          (ex): boolean => ex.code === errors.NotFound.code
        );
      });

      test('throws an exception if the query is not authorized.', async (): Promise<void> => {
        (application.infrastructure.ask as any).viewStore.domainEvents = [];

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.queryValue({
            viewName: 'sampleView',
            queryName: 'valueAuthorized'
          });
        }).is.throwingAsync<CustomError>(
          (ex): boolean => ex.code === errors.QueryNotAuthorized.code
        );
      });

      test('returns the result item and respects the given options.', async (): Promise<void> => {
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

        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const queryResultItem = await client.queryValue({
          viewName: 'sampleView',
          queryName: 'valueWithOptions',
          queryOptions: { filter: { domainEventName: 'executed' }}
        });

        assert.that(queryResultItem).is.equalTo(domainEvents[0]);
      });
    });
  });
});
