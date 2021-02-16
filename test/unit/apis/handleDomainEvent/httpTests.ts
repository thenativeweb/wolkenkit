import { Application } from '../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../../lib/common/utils/test/buildDomainEvent';
import { DomainEvent } from '../../../../lib/common/elements/DomainEvent';
import { DomainEventData } from '../../../../lib/common/elements/DomainEventData';
import { errors } from '../../../../lib/common/errors';
import { Application as ExpressApplication } from 'express';
import { getApi } from '../../../../lib/apis/handleDomainEvent/http';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { runAsServer } from '../../../shared/http/runAsServer';
import { v4 } from 'uuid';

suite('handleDomainEvent/http', (): void => {
  let application: Application;

  suite('/v2', (): void => {
    suiteSetup(async (): Promise<void> => {
      const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

      application = await loadApplication({ applicationDirectory });
    });

    suite('POST /', (): void => {
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

      test('returns 415 if the content-type header is missing.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/',
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
          code: errors.ContentTypeMismatch.code,
          message: 'Header content-type must be application/json.'
        });
      });

      test('returns 415 if content-type is not set to application/json.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/',
          headers: {
            'content-type': 'text/plain'
          },
          data: 'foobar',
          responseType: 'text',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(415);
        assert.that(data).is.equalTo({
          code: errors.ContentTypeMismatch.code,
          message: 'Header content-type must be application/json.'
        });
      });

      test('returns 400 if a malformed domain event is sent.', async (): Promise<void> => {
        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/',
          data: { domainEvent: {}},
          responseType: 'text',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.RequestMalformed.code,
          message: 'Missing required property: aggregateIdentifier (at requestBody.domainEvent.aggregateIdentifier).'
        });
      });

      test('returns 400 if a wellformed domain event is sent with a non-existent context name.', async (): Promise<void> => {
        const domainEventExecuted = new DomainEvent({
          ...buildDomainEvent({
            aggregateIdentifier: {
              context: { name: 'nonExistent' },
              aggregate: { name: 'sampleAggregate', id: v4() }
            },
            name: 'executed',
            data: { strategy: 'succeed' },
            id: v4(),
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: 1
            }
          })
        });

        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/',
          data: { domainEvent: domainEventExecuted },
          responseType: 'text',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.ContextNotFound.code,
          message: `Context 'nonExistent' not found.`
        });
      });

      test('returns 400 if a wellformed domain event is sent with a non-existent aggregate name.', async (): Promise<void> => {
        const domainEventExecuted = new DomainEvent({
          ...buildDomainEvent({
            aggregateIdentifier: {
              context: { name: 'sampleContext' },
              aggregate: { name: 'nonExistent', id: v4() }
            },
            name: 'executed',
            data: { strategy: 'succeed' },
            id: v4(),
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: 1
            }
          })
        });

        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/',
          data: { domainEvent: domainEventExecuted },
          responseType: 'text',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.AggregateNotFound.code,
          message: `Aggregate 'sampleContext.nonExistent' not found.`
        });
      });

      test('returns 400 if a wellformed domain event is sent with a non-existent domain event name.', async (): Promise<void> => {
        const domainEventExecuted = new DomainEvent({
          ...buildDomainEvent({
            aggregateIdentifier: {
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: v4() }
            },
            name: 'nonExistent',
            data: { strategy: 'succeed' },
            id: v4(),
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: 1
            }
          })
        });

        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/',
          data: { domainEvent: domainEventExecuted },
          responseType: 'text',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.DomainEventNotFound.code,
          message: `Domain event 'sampleContext.sampleAggregate.nonExistent' not found.`
        });
      });

      test('returns 400 if a domain event is sent with a payload that does not match the schema.', async (): Promise<void> => {
        const domainEventExecuted = new DomainEvent({
          ...buildDomainEvent({
            aggregateIdentifier: {
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: v4() }
            },
            name: 'executed',
            data: { strategy: 'invalidValue' },
            id: v4(),
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: 1
            }
          })
        });

        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/',
          data: { domainEvent: domainEventExecuted },
          responseType: 'text',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.DomainEventMalformed.code,
          message: 'No enum match (invalidValue), expects: succeed, fail, reject (at domainEvent.data.strategy).'
        });
      });

      test('returns 400 if a non-existent flow name is sent.', async (): Promise<void> => {
        const domainEventExecuted = new DomainEvent({
          ...buildDomainEvent({
            aggregateIdentifier: {
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: v4() }
            },
            name: 'executed',
            data: { strategy: 'succeed' },
            id: v4(),
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: 1
            }
          })
        });

        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/',
          data: { flowNames: [ 'nonExistent' ], domainEvent: domainEventExecuted },
          responseType: 'text',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(400);
        assert.that(data).is.equalTo({
          code: errors.FlowNotFound.code,
          message: `Flow 'nonExistent' not found.`
        });
      });

      test('returns 200 if a wellformed and existing domain event is sent.', async (): Promise<void> => {
        const domainEventExecuted = new DomainEvent({
          ...buildDomainEvent({
            aggregateIdentifier: {
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: v4() }
            },
            name: 'executed',
            data: { strategy: 'succeed' },
            id: v4(),
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: 1
            }
          })
        });

        const { client } = await runAsServer({ app: api });

        const { status } = await client({
          method: 'post',
          url: '/v2/',
          data: { domainEvent: domainEventExecuted }
        });

        assert.that(status).is.equalTo(200);
      });

      test('returns 200 if a wellformed and existing domain event is sent for a specific flow.', async (): Promise<void> => {
        const domainEventExecuted = new DomainEvent({
          ...buildDomainEvent({
            aggregateIdentifier: {
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: v4() }
            },
            name: 'executed',
            data: { strategy: 'succeed' },
            id: v4(),
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: 1
            }
          })
        });

        const { client } = await runAsServer({ app: api });

        const { status } = await client({
          method: 'post',
          url: '/v2/',
          data: { flowNames: [ 'sampleFlow' ], domainEvent: domainEventExecuted }
        });

        assert.that(status).is.equalTo(200);
      });

      test('receives domain events.', async (): Promise<void> => {
        const domainEventExecuted = new DomainEvent({
          ...buildDomainEvent({
            aggregateIdentifier: {
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: v4() }
            },
            name: 'executed',
            data: { strategy: 'succeed' },
            id: v4(),
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: 1
            }
          })
        });

        const { client } = await runAsServer({ app: api });

        await client({
          method: 'post',
          url: '/v2/',
          data: { domainEvent: domainEventExecuted }
        });

        assert.that(receivedDomainEvents.length).is.equalTo(1);
        assert.that(receivedDomainEvents[0]).is.atLeast({
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

      test('receives domain events for specific flows.', async (): Promise<void> => {
        const domainEventExecuted = new DomainEvent({
          ...buildDomainEvent({
            aggregateIdentifier: {
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: v4() }
            },
            name: 'executed',
            data: { strategy: 'succeed' },
            id: v4(),
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: 1
            }
          })
        });

        const { client } = await runAsServer({ app: api });

        await client({
          method: 'post',
          url: '/v2/',
          data: { flowNames: [ 'sampleFlow' ], domainEvent: domainEventExecuted }
        });

        assert.that(receivedDomainEvents.length).is.equalTo(1);
        assert.that(receivedDomainEvents[0]).is.atLeast({
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

      test('returns a 200.', async (): Promise<void> => {
        const domainEventExecuted = new DomainEvent({
          ...buildDomainEvent({
            aggregateIdentifier: {
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: v4() }
            },
            name: 'executed',
            data: { strategy: 'succeed' },
            id: v4(),
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: 1
            }
          })
        });

        const { client } = await runAsServer({ app: api });

        const { status } = await client({
          method: 'post',
          url: '/v2/',
          data: { domainEvent: domainEventExecuted }
        });

        assert.that(status).is.equalTo(200);
      });

      test('returns 500 if on received domain event throws an error.', async (): Promise<void> => {
        ({ api } = await getApi({
          corsOrigin: '*',
          async onReceiveDomainEvent (): Promise<void> {
            throw new Error('Failed to handle received domain event.');
          },
          application
        }));

        const domainEventExecuted = new DomainEvent({
          ...buildDomainEvent({
            aggregateIdentifier: {
              context: { name: 'sampleContext' },
              aggregate: { name: 'sampleAggregate', id: v4() }
            },
            name: 'executed',
            data: { strategy: 'succeed' },
            id: v4(),
            metadata: {
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}},
              revision: 1
            }
          })
        });

        const { client } = await runAsServer({ app: api });

        const { status, data } = await client({
          method: 'post',
          url: '/v2/',
          data: { domainEvent: domainEventExecuted },
          responseType: 'text',
          validateStatus (): boolean {
            return true;
          }
        });

        assert.that(status).is.equalTo(500);
        assert.that(data).is.equalTo({
          code: errors.UnknownError.code,
          message: 'Unknown error.'
        });
      });
    });
  });
});
