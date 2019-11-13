import { ApplicationDefinition } from '../../../../lib/common/application/ApplicationDefinition';
import assert from 'assertthat';
import { buildDomainEvent } from '../../../shared/buildDomainEvent';
import { DomainEventData } from '../../../../lib/common/elements/DomainEventData';
import { DomainEventWithState } from '../../../../lib/common/elements/DomainEventWithState';
import { getApplicationDefinition } from '../../../../lib/common/application/getApplicationDefinition';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { Http } from '../../../../lib/apis/domainEventReceiver/Http';
import { State } from '../../../../lib/common/elements/State';
import uuid from 'uuidv4';
import supertest, { Response } from 'supertest';

suite('domainEventReceiver/Http', (): void => {
  let applicationDefinition: ApplicationDefinition;

  suiteSetup(async (): Promise<void> => {
    const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

    applicationDefinition = await getApplicationDefinition({ applicationDirectory });
  });

  suite('CORS', (): void => {
    const corsOrigins = [
      {
        title: 'returns * if anything is allowed.',
        origin: 'http://www.thenativeweb.io',
        allow: '*',
        expected: '*'
      },
      {
        title: 'returns origin if origin is allowed.',
        origin: 'http://www.thenativeweb.io',
        allow: 'http://www.thenativeweb.io',
        expected: 'http://www.thenativeweb.io'
      },
      {
        title: 'returns origin if origin is allowed by a regular expression.',
        origin: 'http://www.thenativeweb.io',
        allow: [ /\.thenativeweb\.io$/u ],
        expected: 'http://www.thenativeweb.io'
      },
      {
        title: 'returns origin if origin is one of multiple allowed.',
        origin: 'http://www.thenativeweb.io',
        allow: [ 'http://www.thenativeweb.io', 'http://www.example.com' ],
        expected: 'http://www.thenativeweb.io'
      },
      {
        title: 'returns undefined if origin is not allowed.',
        origin: 'http://www.example.com',
        allow: 'http://www.thenativeweb.io',
        expected: undefined
      },
      {
        title: 'returns undefined if origin is not allowed by a regular expression.',
        origin: 'http://www.example.com',
        allow: [ /\.thenativeweb\.io$/u ],
        expected: undefined
      }
    ];

    for (const corsOrigin of corsOrigins) {
      /* eslint-disable no-loop-func */
      test(corsOrigin.title, async (): Promise<void> => {
        const http = await Http.create({
          corsOrigin: corsOrigin.allow,
          async onReceiveDomainEvent (): Promise<void> {
            // Intentionally left blank.
          },
          applicationDefinition
        });

        await supertest(http.api).
          options('/').
          set({
            origin: corsOrigin.origin,
            'access-control-request-method': 'POST',
            'access-control-request-headers': 'X-Requested-With'
          }).
          expect((res: Response): void => {
            assert.that(res.status).is.equalTo(200);
            assert.that(res.header['access-control-allow-origin']).is.equalTo(corsOrigin.expected);
            assert.that(res.header['access-control-allow-methods']).is.equalTo('GET,POST');
          });
      });
      /* eslint-enable no-loop-func */
    }
  });

  suite('POST /v2/', (): void => {
    let http: Http,
        receivedDomainEvents: DomainEventWithState<DomainEventData, State>[];

    setup(async (): Promise<void> => {
      receivedDomainEvents = [];

      http = await Http.create({
        corsOrigin: '*',
        async onReceiveDomainEvent ({ domainEvent }: {
          domainEvent: DomainEventWithState<DomainEventData, State>;
        }): Promise<void> {
          receivedDomainEvents.push(domainEvent);
        },
        applicationDefinition
      });
    });

    test('returns 415 if the content-type header is missing.', async (): Promise<void> => {
      await supertest(http.api).
        post('/v2/').
        expect((res: Response): void => {
          assert.that(res.status).is.equalTo(415);
          assert.that(res.text).is.equalTo('Header content-type must be application/json.');
        });
    });

    test('returns 415 if content-type is not set to application/json.', async (): Promise<void> => {
      await supertest(http.api).
        post('/v2/').
        set({
          'content-type': 'text/plain'
        }).
        send('foobar').
        expect((res: Response): void => {
          assert.that(res.status).is.equalTo(415);
          assert.that(res.text).is.equalTo('Header content-type must be application/json.');
        });
    });

    test('returns 400 if a malformed domain event is sent.', async (): Promise<void> => {
      await supertest(http.api).
        post('/v2/').
        send({ foo: 'bar' }).
        expect((res: Response): void => {
          assert.that(res.status).is.equalTo(400);
          assert.that(res.text).is.equalTo('Invalid type: undefined should be object (at domainEvent.state).');
        });
    });

    test('returns 400 if a wellformed domain event is sent with a non-existent context name.', async (): Promise<void> => {
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

      await supertest(http.api).
        post('/v2/').
        send(domainEventExecuted).
        expect((res: Response): void => {
          assert.that(res.status).is.equalTo(400);
          assert.that(res.text).is.equalTo(`Context 'nonExistent' not found.`);
        });
    });

    test('returns 400 if a wellformed domain event is sent with a non-existent aggregate name.', async (): Promise<void> => {
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

      await supertest(http.api).
        post('/v2/').
        send(domainEventExecuted).
        expect((res: Response): void => {
          assert.that(res.status).is.equalTo(400);
          assert.that(res.text).is.equalTo(`Aggregate 'sampleContext.nonExistent' not found.`);
        });
    });

    test('returns 400 if a wellformed domain event is sent with a non-existent domain event name.', async (): Promise<void> => {
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

      await supertest(http.api).
        post('/v2/').
        send(domainEventExecuted).
        expect((res: Response): void => {
          assert.that(res.status).is.equalTo(400);
          assert.that(res.text).is.equalTo(`Domain event 'sampleContext.sampleAggregate.nonExistent' not found.`);
        });
    });

    test('returns 400 if a domain event is sent with a payload that does not match the schema.', async (): Promise<void> => {
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

      await supertest(http.api).
        post('/v2/').
        send(domainEventExecuted).
        expect((res: Response): void => {
          assert.that(res.status).is.equalTo(400);
          assert.that(res.text).is.equalTo('No enum match (invalidValue), expects: succeed, fail, reject (at domainEvent.data.strategy).');
        });
    });

    test('returns 200 if a wellformed and existing domain event is sent.', async (): Promise<void> => {
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

      await supertest(http.api).
        post('/v2/').
        send(domainEventExecuted).
        expect((res: Response): void => {
          assert.that(res.status).is.equalTo(200);
        });
    });

    test('receives domain events.', async (): Promise<void> => {
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

      await supertest(http.api).
        post('/v2/').
        send(domainEventExecuted);

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

    test('returns a 200.', async (): Promise<void> => {
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

      await supertest(http.api).
        post('/v2/').
        send(domainEventExecuted).
        expect((res: Response): void => {
          assert.that(res.status).is.equalTo(200);
        });
    });

    test('returns 500 if on received domain event throws an error.', async (): Promise<void> => {
      http = await Http.create({
        corsOrigin: '*',
        async onReceiveDomainEvent (): Promise<void> {
          throw new Error('Failed to handle received domain event.');
        },
        applicationDefinition
      });

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

      await supertest(http.api).
        post('/v2/').
        send(domainEventExecuted).
        expect((res: Response): void => {
          assert.that(res.status).is.equalTo(500);
        });
    });
  });
});
