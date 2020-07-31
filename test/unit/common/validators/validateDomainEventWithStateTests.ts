import { Application } from '../../../../lib/common/application/Application';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../../lib/common/utils/test/buildDomainEvent';
import { CustomError } from 'defekt';
import { DomainEventWithState } from '../../../../lib/wolkenkit';
import { errors } from '../../../../lib/common/errors';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { loadApplication } from '../../../../lib/common/application/loadApplication';
import { v4 } from 'uuid';
import { validateDomainEventWithState } from '../../../../lib/common/validators/validateDomainEventWithState';

suite('validateDomainEventWithState', (): void => {
  const applicationDirectory = getTestApplicationDirectory({ name: 'base' });
  const user = {
    id: 'jane.doe',
    claims: { sub: 'jane.doe' }
  };

  const domainEvent = new DomainEventWithState({
    ...buildDomainEvent({
      contextIdentifier: { name: 'sampleContext' },
      aggregateIdentifier: { name: 'sampleAggregate', id: v4() },
      name: 'executed',
      data: {
        strategy: 'succeed'
      },
      metadata: {
        initiator: { user },
        revision: 1
      }
    }),
    state: {
      next: {},
      previous: {}
    }
  });

  let application: Application;

  suiteSetup(async (): Promise<void> => {
    application = await loadApplication({ applicationDirectory });
  });

  test('does not throw an error if everything is fine.', async (): Promise<void> => {
    assert.that((): void => {
      validateDomainEventWithState({ domainEvent, application });
    }).is.not.throwing();
  });

  test(`throws an error if the domainEvent's context doesn't exist in the application definition.`, async (): Promise<void> => {
    assert.that((): void => {
      validateDomainEventWithState({
        domainEvent: new DomainEventWithState({
          ...domainEvent,
          contextIdentifier: {
            name: 'someContext'
          }
        }),
        application
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.ContextNotFound.code &&
        ex.message === `Context 'someContext' not found.`
    );
  });

  test(`throws an error if the domainEvent's aggregate doesn't exist in the application definition.`, async (): Promise<void> => {
    assert.that((): void => {
      validateDomainEventWithState({
        domainEvent: new DomainEventWithState({
          ...domainEvent,
          aggregateIdentifier: {
            name: 'someAggregate',
            id: v4()
          }
        }),
        application
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.AggregateNotFound.code &&
        ex.message === `Aggregate 'sampleContext.someAggregate' not found.`
    );
  });

  test(`throws an error if the domainEvent doesn't exist in the application definition.`, async (): Promise<void> => {
    assert.that((): void => {
      validateDomainEventWithState({
        domainEvent: new DomainEventWithState({
          ...domainEvent,
          name: 'someDomainEvent'
        }),
        application
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.DomainEventNotFound.code &&
        ex.message === `Domain event 'sampleContext.sampleAggregate.someDomainEvent' not found.`
    );
  });

  test(`throws an error if the domainEvent's data doesn't match its schema.`, async (): Promise<void> => {
    assert.that((): void => {
      validateDomainEventWithState({
        domainEvent: new DomainEventWithState({
          ...domainEvent,
          data: {
            foo: ''
          }
        }),
        application
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === errors.DomainEventMalformed.code &&
        ex.message === `Missing required property: strategy (at domainEvent.data.strategy).`
    );
  });
});
