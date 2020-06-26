'use strict';

const { assert } = require('assertthat');
const path = require('path');
const { uuid } = require('uuidv4');
const { loadApplication, sandbox } = require('wolkenkit');

suite('sampleAggregate', () => {
  let application;

  suiteSetup(async () => {
    application = await loadApplication({
      applicationDirectory: path.join(__dirname, '..', '..', '..')
    });
  });

  suite('sampleCommand', () => {
    test('publishes a sample domain event.', async () => {
      const contextIdentifier = { name: 'sampleContext' };
      const aggregateIdentifier = { name: 'sampleAggregate', id: uuid() };

      await sandbox().
        withApplication({ application }).
        forAggregate({ contextIdentifier, aggregateIdentifier }).
        when({ name: 'sampleCommand', data: {}}).
        then(({ domainEvents, state }) => {
          assert.that(domainEvents.length).is.equalTo(1);
          assert.that(domainEvents[0].name).is.equalTo('sampleDomainEvent');
          assert.that(domainEvents[0].data).is.equalTo({});
          assert.that(state).is.equalTo({ domainEventNames: [ 'sampleDomainEvent' ]});
        });
    });
  });
});
