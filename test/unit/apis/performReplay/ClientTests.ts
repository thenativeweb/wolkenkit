import { AggregateIdentifier } from '../../../../lib/common/elements/AggregateIdentifier';
import { Application } from '../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { Client } from '../../../../lib/apis/performReplay/http/v2/Client';
import { CustomError } from 'defekt';
import { errors } from '../../../../lib/common/errors';
import { Application as ExpressApplication } from 'express';
import { getApi } from '../../../../lib/apis/performReplay/http';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { runAsServer } from '../../../shared/http/runAsServer';
import { v4 } from 'uuid';

suite('performReplay/http/Client', (): void => {
  let application: Application;

  suite('/v2', (): void => {
    suiteSetup(async (): Promise<void> => {
      const applicationDirectory = getTestApplicationDirectory({ name: 'base', language: 'javascript' });

      application = await loadApplication({ applicationDirectory });
    });

    suite('performReplay', (): void => {
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

      test('performs a replay for the given flows.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const aggregateId = v4();

        await client.performReplay({
          flowNames: [ 'sampleFlow' ],
          aggregates: [{
            aggregateIdentifier: {
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: aggregateId }
            },
            from: 23,
            to: 42
          }]
        });

        assert.that(requestedReplays.length).is.equalTo(1);
        assert.that(requestedReplays[0]).is.equalTo({
          flowNames: [ 'sampleFlow' ],
          aggregates: [{
            aggregateIdentifier: {
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: aggregateId }
            },
            from: 23,
            to: 42
          }]
        });
      });

      test('performs a replay for all flows if no flow is given.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const aggregateId = v4();

        await client.performReplay({
          aggregates: [{
            aggregateIdentifier: {
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: aggregateId }
            },
            from: 23,
            to: 42
          }]
        });

        assert.that(requestedReplays.length).is.equalTo(1);
        assert.that(requestedReplays[0]).is.equalTo({
          flowNames: [ 'sampleFlow' ],
          aggregates: [{
            aggregateIdentifier: {
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: aggregateId }
            },
            from: 23,
            to: 42
          }]
        });
      });

      test('throws an error if an unknown context is given.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const aggregateId = v4();

        await assert.that(async (): Promise<void> => {
          await client.performReplay({
            flowNames: [ 'sampleFlow' ],
            aggregates: [{
              aggregateIdentifier: {
                context: { name: 'nonExistent' },
                aggregate: { name: 'sampleAggregate', id: aggregateId }
              },
              from: 23,
              to: 42
            }]
          });
        }).is.throwingAsync((ex): boolean => (ex as CustomError).code === errors.ContextNotFound.code);
      });

      test('throws an error if an unknown aggregate is given.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const aggregateId = v4();

        await assert.that(async (): Promise<void> => {
          await client.performReplay({
            flowNames: [ 'sampleFlow' ],
            aggregates: [{
              aggregateIdentifier: {
                context: { name: 'sampleContext' },
                aggregate: { name: 'nonExistent', id: aggregateId }
              },
              from: 23,
              to: 42
            }]
          });
        }).is.throwingAsync((ex): boolean => (ex as CustomError).code === errors.AggregateNotFound.code);
      });

      test('throws an error if an unknown flow is given.', async (): Promise<void> => {
        const { socket } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          portOrSocket: socket,
          path: '/v2'
        });

        const aggregateId = v4();

        await assert.that(async (): Promise<void> => {
          await client.performReplay({
            flowNames: [ 'nonExistent' ],
            aggregates: [{
              aggregateIdentifier: {
                context: { name: 'sampleContext' },
                aggregate: { name: 'sampleAggregate', id: aggregateId }
              },
              from: 23,
              to: 42
            }]
          });
        }).is.throwingAsync((ex): boolean => (ex as CustomError).code === errors.FlowNotFound.code);
      });
    });
  });
});
