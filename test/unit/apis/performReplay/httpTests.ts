import { AggregateIdentifier } from '../../../../lib/common/elements/AggregateIdentifier';
import { Application } from '../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { Application as ExpressApplication } from 'express';
import { getApi } from '../../../../lib/apis/performReplay/http';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { runAsServer } from '../../../shared/http/runAsServer';
import { uuid } from 'uuidv4';

suite('performReplay/http', (): void => {
  let application: Application;

  suite('/v2', (): void => {
    suiteSetup(async (): Promise<void> => {
      const applicationDirectory = getTestApplicationDirectory({ name: 'base', language: 'javascript' });

      application = await loadApplication({ applicationDirectory });
    });

    suite('POST /', (): void => {
      let api: ExpressApplication,
          requestedReplays: {
            flowNames: string[];
            aggregates: {
              aggregateIdentifier: AggregateIdentifier;
              from: number;
              to: number;
            }[];
          }[];

      setup(async (): Promise<void> => {
        requestedReplays = [];

        ({ api } = await getApi({
          corsOrigin: '*',
          async performReplay ({ flowNames, aggregates }): Promise<void> {
            requestedReplays.push({ flowNames, aggregates });
          },
          application
        }));
      });

      test('returns 415 if the content-type header is missing.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: `/v2/`,
          headers: {
            'content-type': ''
          },
          responseType: 'text',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(415);
        assert.that(data).is.equalTo({
          code: 'EREQUESTMALFORMED',
          message: 'Header content-type must be application/json.'
        });
      });

      test('returns 415 if content-type is not set to application/json.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: `/v2/`,
          headers: {
            'content-type': 'text/plain'
          },
          responseType: 'text',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(415);
        assert.that(data).is.equalTo({
          code: 'EREQUESTMALFORMED',
          message: 'Header content-type must be application/json.'
        });
      });

      test('returns 400 if a replay is requested with a payload that does not match the schema.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: `/v2/`,
          data: {
            flowNames: [],
            aggregates: [{
              aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
              from: 23,
              to: 42
            }]
          },
          responseType: 'text',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: 'EREQUESTMALFORMED',
          message: 'Array is too short (0), minimum 1 (at value.flowNames).'
        });
      });

      test('returns 200 if a replay is requested.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status } = await client({
          method: 'post',
          url: `/v2/`,
          data: {
            flowNames: [ 'sampleFlow' ],
            aggregates: [{
              aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
              from: 23,
              to: 42
            }]
          }
        });

        assert.that(status).is.equalTo(200);
      });

      test('receives replay requests.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });
        const aggregateId = uuid();

        await client({
          method: 'post',
          url: `/v2/`,
          data: {
            flowNames: [ 'sampleFlow' ],
            aggregates: [{
              aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
              from: 23,
              to: 42
            }]
          }
        });

        assert.that(requestedReplays.length).is.equalTo(1);
        assert.that(requestedReplays[0]).is.equalTo({
          flowNames: [ 'sampleFlow' ],
          aggregates: [{
            aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
            from: 23,
            to: 42
          }]
        });
      });

      test('replays all flows if no flow is given.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });
        const aggregateId = uuid();

        await client({
          method: 'post',
          url: `/v2/`,
          data: {
            aggregates: [{
              aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
              from: 23,
              to: 42
            }]
          }
        });

        assert.that(requestedReplays.length).is.equalTo(1);
        assert.that(requestedReplays[0]).is.equalTo({
          flowNames: [ 'sampleFlow' ],
          aggregates: [{
            aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
            from: 23,
            to: 42
          }]
        });
      });

      test('returns 500 if on perform replay throws an error.', async (): Promise<void> => {
        ({ api } = await getApi({
          corsOrigin: '*',
          async performReplay (): Promise<void> {
            throw new Error('Failed to handle requested replay.');
          },
          application
        }));

        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/',
          data: {
            flowNames: [ 'sampleFlow' ],
            aggregates: [{
              aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
              from: 23,
              to: 42
            }]
          },
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(500);
        assert.that(data).is.equalTo({
          code: 'EUNKNOWNERROR',
          message: 'Unknown error.'
        });
      });
    });
  });
});
