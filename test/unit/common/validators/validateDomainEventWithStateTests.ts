import { ApplicationDefinition } from '../../../../lib/common/application/ApplicationDefinition';
import { assert } from 'assertthat';
import { buildDomainEvent } from '../../../shared/buildDomainEvent';
import { CustomError } from 'defekt';
import { DomainEventWithState } from '../../../../lib/wolkenkit';
import { getApplicationDefinition } from '../../../../lib/common/application/getApplicationDefinition';
import { getTestApplicationDirectory } from '../../../shared/applications/getTestApplicationDirectory';
import { uuid } from 'uuidv4';
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
      aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
      name: 'executed',
      data: {
        strategy: 'succeed'
      },
      metadata: {
        initiator: { user },
        revision: { aggregate: 1 }
      }
    }),
    state: {
      next: {},
      previous: {}
    }
  });

  let applicationDefinition: ApplicationDefinition;

  suiteSetup(async (): Promise<void> => {
    applicationDefinition = await getApplicationDefinition({ applicationDirectory });
  });

  test('does not throw an error if everything is fine.', async (): Promise<void> => {
    assert.that((): void => {
      validateDomainEventWithState({ domainEvent, applicationDefinition });
    }).is.not.throwing();
  });

  test('throws an error if the domain event does not match the domainEvent schema.', async (): Promise<void> => {
    assert.that((): void => {
      validateDomainEventWithState({
        domainEvent: new DomainEventWithState({
          ...domainEvent,
          name: ''
        }),
        applicationDefinition
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'EDOMAINEVENTMALFORMED' &&
        ex.message === 'String is too short (0 chars), minimum 1 (at domainEvent.name).'
    );
  });

  test('throws an error if the aggregate revision is greater than the global revision.', async (): Promise<void> => {
    assert.that((): void => {
      validateDomainEventWithState({
        domainEvent: new DomainEventWithState({
          ...domainEvent,
          metadata: {
            ...domainEvent.metadata,
            revision: {
              aggregate: 5,
              global: 2
            }
          }
        }),
        applicationDefinition
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'EDOMAINEVENTMALFORMED' &&
        ex.message === 'Aggregate revision must be less than global revision.'
    );
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
        applicationDefinition
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'ECONTEXTNOTFOUND' &&
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
            id: uuid()
          }
        }),
        applicationDefinition
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'EAGGREGATENOTFOUND' &&
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
        applicationDefinition
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'EDOMAINEVENTNOTFOUND' &&
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
        applicationDefinition
      });
    }).is.throwing(
      (ex): boolean =>
        (ex as CustomError).code === 'EDOMAINEVENTMALFORMED' &&
        ex.message === `Missing required property: strategy (at domainEvent.data.strategy).`
    );
  });
});
