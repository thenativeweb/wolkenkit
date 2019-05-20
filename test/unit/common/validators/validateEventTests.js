'use strict';

const path = require('path');

const assert = require('assertthat'),
      uuid = require('uuidv4');

const { Application } = require('../../../../common/application'),
      { Event } = require('../../../../common/elements'),
      { validateEvent } = require('../../../../common/validators');

suite('validateEvent', () => {
  let application;

  setup(async () => {
    const directory = path.join(__dirname, '..', '..', '..', 'shared', 'applications', 'base');

    application = await Application.load({ directory });
  });

  test('is a function.', async () => {
    assert.that(validateEvent).is.ofType('function');
  });

  test('throws an error if event is missing.', async () => {
    assert.that(() => {
      validateEvent({ application });
    }).is.throwing('Event is missing.');
  });

  test('throws an error if application is missing.', async () => {
    assert.that(() => {
      validateEvent({ event: {}});
    }).is.throwing('Application is missing.');
  });

  test('throws an error if event is malformed.', async () => {
    assert.that(() => {
      validateEvent({ event: {}, application });
    }).is.throwing('Malformed event.');
  });

  test('throws an error if context name is invalid.', async () => {
    assert.that(() => {
      validateEvent({
        event: new Event({
          context: { name: 'nonExistent' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: { causationId: uuid(), correlationId: uuid(), revision: 1 }
        }),
        application
      });
    }).is.throwing('Invalid context name.');
  });

  test('throws an error if aggregate name is invalid.', async () => {
    assert.that(() => {
      validateEvent({
        event: new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'nonExistent', id: uuid() },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: { causationId: uuid(), correlationId: uuid(), revision: 1 }
        }),
        application
      });
    }).is.throwing('Invalid aggregate name.');
  });

  test('throws an error if event name is invalid.', async () => {
    assert.that(() => {
      validateEvent({
        event: new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'nonExistent',
          data: { strategy: 'succeed' },
          metadata: { causationId: uuid(), correlationId: uuid(), revision: 1 }
        }),
        application
      });
    }).is.throwing('Invalid event name.');
  });

  test('throws an error if the schema does not match.', async () => {
    assert.that(() => {
      validateEvent({
        event: new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'executed',
          data: { strategy: 'nonExistent' },
          metadata: { causationId: uuid(), correlationId: uuid(), revision: 1 }
        }),
        application
      });
    }).is.throwing('No enum match (nonExistent), expects: succeed, fail, reject (at event.data.strategy).');
  });

  test('does not throw an error if the schema matches.', async () => {
    assert.that(() => {
      validateEvent({
        event: new Event({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'executed',
          data: { strategy: 'succeed' },
          metadata: { causationId: uuid(), correlationId: uuid(), revision: 1 }
        }),
        application
      });
    }).is.not.throwing();
  });
});
