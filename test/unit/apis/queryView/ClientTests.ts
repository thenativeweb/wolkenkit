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

    suite('query', (): void => {
      let api: ExpressApplication;

      setup(async (): Promise<void> => {
        ({ api } = await getApi({
          corsOrigin: '*',
          application,
          identityProviders
        }));
      });

      test('throws an exception if an invalid view name is given.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.query({ viewName: 'nonExistent', queryName: 'all' });
        }).is.throwingAsync((ex): boolean =>
          (ex as CustomError).code === errors.ViewNotFound.code &&
          (ex as CustomError).message === `View 'nonExistent' not found.`);
      });

      test('throws an exception if an invalid query name is given.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.query({ viewName: 'sampleView', queryName: 'nonExistent' });
        }).is.throwingAsync((ex): boolean =>
          (ex as CustomError).code === errors.QueryHandlerNotFound.code &&
          (ex as CustomError).message === `Query handler 'sampleView.nonExistent' not found.`);
      });

      test('throws an exception if invalid options are given.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.query({
            viewName: 'sampleView',
            queryName: 'withOptions',
            queryOptions: { foo: 'bar' }
          });
        }).is.throwingAsync((ex): boolean =>
          (ex as CustomError).code === errors.QueryOptionsInvalid.code &&
          (ex as CustomError).message === `Missing required property: filter (at queryHandlerOptions.filter).`);
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

        const resultStream = await client.query({
          viewName: 'sampleView',
          queryName: 'all'
        });
        const resultItems = [];

        for await (const resultItem of resultStream) {
          resultItems.push(resultItem);
        }

        assert.that(resultItems).is.equalTo(domainEvents);
      });

      test('streams the result items based on options.', async (): Promise<void> => {
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

        const resultStream = await client.query({
          viewName: 'sampleView',
          queryName: 'withOptions',
          queryOptions: { filter: { domainEventName: 'executed' }}
        });
        const resultItems = [];

        for await (const resultItem of resultStream) {
          resultItems.push(resultItem);
        }

        assert.that(resultItems).is.equalTo([ domainEvents[0] ]);
      });
    });
  });
});
