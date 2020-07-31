import { Application } from '../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../../lib/common/utils/test/buildDomainEvent';
import { Client } from '../../../../lib/apis/handleDomainEvent/http/v2/Client';
import { CustomError } from 'defekt';
import { DomainEvent } from '../../../../lib/common/elements/DomainEvent';
import { DomainEventData } from '../../../../lib/common/elements/DomainEventData';
import { errors } from '../../../../lib/common/errors';
import { Application as ExpressApplication } from 'express';
import { getApi } from '../../../../lib/apis/handleDomainEvent/http';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { runAsServer } from '../../../shared/http/runAsServer';
import { v4 } from 'uuid';

suite('handleDomainEvent/http/Client', (): void => {
  let application: Application;

  suite('/v2', (): void => {
    suiteSetup(async (): Promise<void> => {
      const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

      application = await loadApplication({ applicationDirectory });
    });

    suite('postDomainEvent', (): void => {
      let api: ExpressApplication,
          receivedDomainEvents: DomainEvent<DomainEventData>[];

      setup(async (): Promise<void> => {
        receivedDomainEvents = [];

        ({ api } = await getApi({
          corsOrigin: '*',
          async onReceiveDomainEvent ({ domainEvent }: {
            domainEvent: DomainEvent<DomainEventData>;
          }): Promise<void> {
            receivedDomainEvents.push(domainEvent);
          },
          application
        }));
      });

      test('throws an error if a domain event is sent with a non-existent context name.', async (): Promise<void> => {
        const domainEventExecuted = new DomainEvent({
          ...buildDomainEvent({
            contextIdentifier: { name: 'nonExistent' },
            aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
            name: 'executed',
            data: { strategy: 'succeed' },
            id: v4(),
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: 1
            }
          })
        });

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.postDomainEvent({ domainEvent: domainEventExecuted });
        }).is.throwingAsync((ex): boolean =>
          (ex as CustomError).code === errors.ContextNotFound.code &&
          (ex as CustomError).message === `Context 'nonExistent' not found.`);
      });

      test('throws an error if a domain event is sent with a non-existent aggregate name.', async (): Promise<void> => {
        const domainEventExecuted = new DomainEvent({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'nonExistent', id: v4() },
            name: 'executed',
            data: { strategy: 'succeed' },
            id: v4(),
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: 1
            }
          })
        });

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.postDomainEvent({ domainEvent: domainEventExecuted });
        }).is.throwingAsync((ex): boolean =>
          (ex as CustomError).code === errors.AggregateNotFound.code &&
          (ex as CustomError).message === `Aggregate 'sampleContext.nonExistent' not found.`);
      });

      test('throws an error if a domain event is sent with a non-existent domain event name.', async (): Promise<void> => {
        const domainEventExecuted = new DomainEvent({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
            name: 'nonExistent',
            data: { strategy: 'succeed' },
            id: v4(),
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: 1
            }
          })
        });

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.postDomainEvent({ domainEvent: domainEventExecuted });
        }).is.throwingAsync((ex): boolean =>
          (ex as CustomError).code === errors.DomainEventNotFound.code &&
          (ex as CustomError).message === `Domain event 'sampleContext.sampleAggregate.nonExistent' not found.`);
      });

      test('throws an error if a domain event is sent with a payload that does not match the schema.', async (): Promise<void> => {
        const domainEventExecuted = new DomainEvent({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
            name: 'executed',
            data: { strategy: 'invalidValue' },
            id: v4(),
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: 1
            }
          })
        });

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.postDomainEvent({ domainEvent: domainEventExecuted });
        }).is.throwingAsync((ex): boolean =>
          (ex as CustomError).code === errors.DomainEventMalformed.code &&
          (ex as CustomError).message === 'No enum match (invalidValue), expects: succeed, fail, reject (at domainEvent.data.strategy).');
      });

      test('throws an error if a non-existent flow name is sent.', async (): Promise<void> => {
        const domainEventExecuted = new DomainEvent({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
            name: 'executed',
            data: { strategy: 'succeed' },
            id: v4(),
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: 1
            }
          })
        });

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.postDomainEvent({ flowNames: [ 'nonExistent' ], domainEvent: domainEventExecuted });
        }).is.throwingAsync((ex): boolean =>
          (ex as CustomError).code === errors.FlowNotFound.code &&
          (ex as CustomError).message === `Flow 'nonExistent' not found.`);
      });

      test('sends domain events.', async (): Promise<void> => {
        const domainEventExecuted = new DomainEvent({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
            name: 'executed',
            data: { strategy: 'succeed' },
            id: v4(),
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: 1
            }
          })
        });

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await client.postDomainEvent({ domainEvent: domainEventExecuted });

        assert.that(receivedDomainEvents.length).is.equalTo(1);
        assert.that(receivedDomainEvents[0]).is.atLeast({
          contextIdentifier: domainEventExecuted.contextIdentifier,
          aggregateIdentifier: domainEventExecuted.aggregateIdentifier,
          name: domainEventExecuted.name,
          data: domainEventExecuted.data,
          metadata: {
            causationId: domainEventExecuted.metadata.causationId,
            correlationId: domainEventExecuted.metadata.correlationId,
            initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
          }
        });

        assert.that(receivedDomainEvents[0].id).is.ofType('string');
        assert.that(receivedDomainEvents[0].metadata.timestamp).is.ofType('number');
      });

      test('throws an error if on received domain event throws an error.', async (): Promise<void> => {
        ({ api } = await getApi({
          corsOrigin: '*',
          async onReceiveDomainEvent (): Promise<void> {
            throw new Error('Failed to handle received domain event.');
          },
          application
        }));

        const domainEventExecuted = new DomainEvent({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
            name: 'executed',
            data: { strategy: 'succeed' },
            id: v4(),
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: 1
            }
          })
        });

        const { port } = await runAsServer({ app: api });
        const client = new Client({
          hostName: 'localhost',
          port,
          path: '/v2'
        });

        await assert.that(async (): Promise<void> => {
          await client.postDomainEvent({ domainEvent: domainEventExecuted });
        }).is.throwingAsync((ex): boolean =>
          (ex as CustomError).code === errors.UnknownError.code &&
          (ex as CustomError).message === 'Unknown error.');
      });
    });
  });
});
