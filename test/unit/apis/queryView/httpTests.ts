import { Application } from '../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { errors } from '../../../../lib/common/errors';
import { Application as ExpressApplication } from 'express';
import { getApi } from '../../../../lib/apis/queryView/http';
import { getApplicationDescription } from '../../../../lib/common/application/getApplicationDescription';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { identityProvider } from '../../../shared/identityProvider';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { runAsServer } from '../../../shared/http/runAsServer';
import streamToString from 'stream-to-string';
import { v4 } from 'uuid';

suite('queryView/http', (): void => {
  const identityProviders = [ identityProvider ];

  suite('/v2', (): void => {
    let api: ExpressApplication,
        application: Application;

    setup(async (): Promise<void> => {
      const applicationDirectory = getTestApplicationDirectory({ name: 'withComplexQueries', language: 'javascript' });

      application = await loadApplication({ applicationDirectory });

      ({ api } = await getApi({
        application,
        corsOrigin: '*',
        identityProviders
      }));
    });

    suite('GET /description', (): void => {
      test('returns 200.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status } = await client({
          method: 'get',
          url: '/v2/description'
        });

        assert.that(status).is.equalTo(200);
      });

      test('returns application/json.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { headers } = await client({
          method: 'get',
          url: '/v2/description'
        });

        assert.that(headers['content-type']).is.equalTo('application/json; charset=utf-8');
      });

      test('returns the commands description.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { data } = await client({
          method: 'get',
          url: '/v2/description'
        });

        const { views: viewsDescription } = getApplicationDescription({
          application
        });

        // Convert and parse as JSON, to get rid of any values that are undefined.
        // This is what the HTTP API does internally, and here we need to simulate
        // this to make things work.
        const expectedViewsDescription = JSON.parse(JSON.stringify(viewsDescription));

        assert.that(data).is.equalTo(expectedViewsDescription);
      });
    });

    suite('GET /:viewName/stream/:queryName', (): void => {
      test('returns 400 if the view name does not exist.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: '/v2/nonExistent/stream/all',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.ViewNotFound.code,
          message: `View 'nonExistent' not found.`
        });
      });

      test('returns 400 if the query handler name does not exist.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: '/v2/sampleView/stream/nonExistent',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.QueryHandlerNotFound.code,
          message: `Query handler 'sampleView.nonExistent' not found.`
        });
      });

      test('returns 400 if the query handler matches a value query, not a stream query.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: '/v2/sampleView/stream/first',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.QueryHandlerTypeMismatch.code,
          message: `Can not query for a stream on a value query handler.`
        });
      });

      test('returns 400 if the options do not match the options schema.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: '/v2/sampleView/stream/streamWithOptions',
          validateStatus (): boolean {
            return true;
          },
          params: { foo: 'bar' },
          paramsSerializer (params): string {
            return Object.entries(params).
              map(([ key, value ]): string => `${key}=${JSON.stringify(value)}`).
              join('&');
          }
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.QueryOptionsInvalid.code,
          message: `Missing required property: filter (at queryHandlerOptions.filter).`
        });
      });

      test('returns 200 and streams the result items.', async (): Promise<void> => {
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

        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: '/v2/sampleView/stream/all',
          responseType: 'stream'
        });

        assert.that(status).is.equalTo(200);

        const streamContent = await streamToString(data);
        const parsedStreamContent = streamContent.
          split('\n').
          filter((line): boolean => line !== '').
          map((line): any => JSON.parse(line));

        assert.that(parsedStreamContent).is.equalTo(domainEvents);
      });

      test('returns 200 and omits items that do not match the item schema.', async (): Promise<void> => {
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

        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: '/v2/sampleView/stream/all',
          responseType: 'stream'
        });

        assert.that(status).is.equalTo(200);

        const streamContent = await streamToString(data);
        const parsedStreamContent = streamContent.
          split('\n').
          filter((line): boolean => line !== '').
          map((line): any => JSON.parse(line));

        assert.that(parsedStreamContent).is.equalTo([ domainEvents[0] ]);
      });

      test('returns 200 and omits unauthorized items.', async (): Promise<void> => {
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

        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: '/v2/sampleView/stream/streamAuthorized',
          responseType: 'stream'
        });

        assert.that(status).is.equalTo(200);

        const streamContent = await streamToString(data);
        const parsedStreamContent = streamContent.
          split('\n').
          filter((line): boolean => line !== '').
          map((line): any => JSON.parse(line));

        assert.that(parsedStreamContent).is.equalTo([]);
      });

      test('returns 200 and respects the given options.', async (): Promise<void> => {
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

        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: '/v2/sampleView/stream/streamWithOptions',
          params: { filter: { domainEventName: 'executed' }},
          paramsSerializer (params): string {
            return Object.entries(params).
              map(([ key, value ]): string => `${key}=${JSON.stringify(value)}`).
              join('&');
          },
          responseType: 'stream'
        });

        assert.that(status).is.equalTo(200);

        const streamContent = await streamToString(data);
        const parsedStreamContent = streamContent.
          split('\n').
          filter((line): boolean => line !== '').
          map((line): any => JSON.parse(line));

        assert.that(parsedStreamContent).is.equalTo([ domainEvents[0] ]);
      });
    });

    suite('GET /:viewName/value/:queryName', (): void => {
      test('returns 400 if the view name does not exist.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: '/v2/nonExistent/value/first',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.ViewNotFound.code,
          message: `View 'nonExistent' not found.`
        });
      });

      test('returns 400 if the query handler name does not exist.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: '/v2/sampleView/value/nonExistent',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.QueryHandlerNotFound.code,
          message: `Query handler 'sampleView.nonExistent' not found.`
        });
      });

      test('returns 400 if the query handler matches a stream query, not a value query.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: '/v2/sampleView/value/all',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.QueryHandlerTypeMismatch.code,
          message: `Can not query for a stream on a value query handler.`
        });
      });

      test('returns 400 if the options do not match the options schema.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: '/v2/sampleView/value/valueWithOptions',
          validateStatus (): boolean {
            return true;
          },
          params: { foo: 'bar' },
          paramsSerializer (params): string {
            return Object.entries(params).
              map(([ key, value ]): string => `${key}=${JSON.stringify(value)}`).
              join('&');
          }
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.QueryOptionsInvalid.code,
          message: `Missing required property: filter (at queryHandlerOptions.filter).`
        });
      });

      test('returns 200 and the result item.', async (): Promise<void> => {
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

        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: '/v2/sampleView/value/first'
        });

        assert.that(status).is.equalTo(200);

        assert.that(data).is.equalTo(domainEvents[0]);
      });

      test('returns 404 if the query does not return a result.', async (): Promise<void> => {
        (application.infrastructure.ask as any).viewStore.domainEvents = [];

        const { client } = await runAsServer({ app: api });

        const { status } = await client({
          method: 'get',
          url: '/v2/sampleView/value/notFound',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(404);
      });

      test('returns 404 if the result item does not match the item schema.', async (): Promise<void> => {
        const domainEvents = [
          {
            foo: 'bar'
          }
        ];

        (application.infrastructure.ask as any).viewStore.domainEvents = domainEvents;

        const { client } = await runAsServer({ app: api });

        const { status } = await client({
          method: 'get',
          url: '/v2/sampleView/value/first',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(404);
      });

      test('returns 404 if the query is not authorized.', async (): Promise<void> => {
        (application.infrastructure.ask as any).viewStore.domainEvents = [];

        const { client } = await runAsServer({ app: api });

        const { status } = await client({
          method: 'get',
          url: '/v2/sampleView/value/valueAuthorized',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(404);
      });

      test('returns 200 and respects the given options.', async (): Promise<void> => {
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

        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'get',
          url: '/v2/sampleView/value/valueWithOptions',
          params: { filter: { domainEventName: 'executed' }},
          paramsSerializer (params): string {
            return Object.entries(params).
              map(([ key, value ]): string => `${key}=${JSON.stringify(value)}`).
              join('&');
          }
        });

        assert.that(status).is.equalTo(200);

        assert.that(data).is.equalTo(domainEvents[0]);
      });
    });
  });
});
