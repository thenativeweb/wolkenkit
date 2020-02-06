import { Application } from 'express';
import { ApplicationDefinition } from '../../../../lib/common/application/ApplicationDefinition';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../shared/buildDomainEvent';
import { Client } from '../../../../lib/apis/handleDomainEvent/http/v2/Client';
import { CustomError } from 'defekt';
import { DomainEventData } from '../../../../lib/common/elements/DomainEventData';
import { DomainEventWithState } from '../../../../lib/common/elements/DomainEventWithState';
import { getApi } from '../../../../lib/apis/handleDomainEvent/http';
import { getApplicationDefinition } from '../../../../lib/common/application/getApplicationDefinition';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { runAsServer } from '../../../shared/http/runAsServer';
import { State } from '../../../../lib/common/elements/State';
import { uuid } from 'uuidv4';

suite('handleDomainEvent/http/Client', (): void => {
  let applicationDefinition: ApplicationDefinition;

  suite('/v2', (): void => {
    suiteSetup(async (): Promise<void> => {
      const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

      applicationDefinition = await getApplicationDefinition({ applicationDirectory });
    });

    suite('postDomainEvent', (): void => {
      let api: Application,
          receivedDomainEvents: DomainEventWithState<DomainEventData, State>[];

      setup(async (): Promise<void> => {
        receivedDomainEvents = [];

        ({ api } = await getApi({
          corsOrigin: '*',
          async onReceiveDomainEvent ({ domainEvent }: {
            domainEvent: DomainEventWithState<DomainEventData, State>;
          }): Promise<void> {
            receivedDomainEvents.push(domainEvent);
          },
          applicationDefinition
        }));
      });

      test('throws an error if a domain event is sent with a non-existent context name.', async (): Promise<void> => {
        const domainEventExecuted = new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: { name: 'nonExistent' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'executed',
            data: { strategy: 'succeed' },
            id: uuid(),
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: { aggregate: 1, global: 1 }
            }
          }),
          state: { previous: {}, next: {}}
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
          (ex as CustomError).code === 'ECONTEXTNOTFOUND' &&
          (ex as CustomError).message === `Context 'nonExistent' not found.`);
      });

      test('throws an error if a domain event is sent with a non-existent aggregate name.', async (): Promise<void> => {
        const domainEventExecuted = new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'nonExistent', id: uuid() },
            name: 'executed',
            data: { strategy: 'succeed' },
            id: uuid(),
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: { aggregate: 1, global: 1 }
            }
          }),
          state: { previous: {}, next: {}}
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
          (ex as CustomError).code === 'EAGGREGATENOTFOUND' &&
          (ex as CustomError).message === `Aggregate 'sampleContext.nonExistent' not found.`);
      });

      test('throws an error if a domain event is sent with a non-existent domain event name.', async (): Promise<void> => {
        const domainEventExecuted = new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'nonExistent',
            data: { strategy: 'succeed' },
            id: uuid(),
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: { aggregate: 1, global: 1 }
            }
          }),
          state: { previous: {}, next: {}}
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
          (ex as CustomError).code === 'EDOMAINEVENTNOTFOUND' &&
          (ex as CustomError).message === `Domain event 'sampleContext.sampleAggregate.nonExistent' not found.`);
      });

      test('throws an error if a domain event is sent with a payload that does not match the schema.', async (): Promise<void> => {
        const domainEventExecuted = new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'executed',
            data: { strategy: 'invalidValue' },
            id: uuid(),
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: { aggregate: 1, global: 1 }
            }
          }),
          state: { previous: {}, next: {}}
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
          (ex as CustomError).code === 'EDOMAINEVENTMALFORMED' &&
          (ex as CustomError).message === 'No enum match (invalidValue), expects: succeed, fail, reject (at domainEvent.data.strategy).');
      });

      test('sends domain events.', async (): Promise<void> => {
        const domainEventExecuted = new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'executed',
            data: { strategy: 'succeed' },
            id: uuid(),
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: { aggregate: 1, global: 1 }
            }
          }),
          state: { previous: {}, next: {}}
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
          applicationDefinition
        }));

        const domainEventExecuted = new DomainEventWithState({
          ...buildDomainEvent({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'executed',
            data: { strategy: 'succeed' },
            id: uuid(),
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: { aggregate: 1, global: 1 }
            }
          }),
          state: { previous: {}, next: {}}
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
          (ex as CustomError).code === 'EUNKNOWNERROR' &&
          (ex as CustomError).message === 'Unknown error.');
      });
    });
  });
});
