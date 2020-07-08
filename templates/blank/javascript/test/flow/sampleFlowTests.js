'use strict';

const { assert } = require('assertthat');
const path = require('path');
const { uuid } = require('uuidv4');
const { loadApplication, sandbox } = require('wolkenkit');

suite('sampleFlow', () => {
  let application;

  setup(async () => {
    application = await loadApplication({
      applicationDirectory: path.join(__dirname, '..', '..')
    });
  });

  test('logs domain events.', async () => {
    const aggregateId = uuid(),
          timestamp = Date.now();

    const logMessages = [];

    await sandbox().
      withApplication({ application }).
      withLoggerServiceFactory({
        loggerServiceFactory () {
          return {
            fatal (message, metadata) {
              logMessages.push({ level: 'fatal', message, metadata });
            },
            error (message, metadata) {
              logMessages.push({ level: 'error', message, metadata });
            },
            warn (message, metadata) {
              logMessages.push({ level: 'warn', message, metadata });
            },
            info (message, metadata) {
              logMessages.push({ level: 'info', message, metadata });
            },
            debug (message, metadata) {
              logMessages.push({ level: 'debug', message, metadata });
            }
          };
        }
      }).
      forFlow({ flowName: 'sampleFlow' }).
      when({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        name: 'sampleDomainEvent',
        data: {},
        metadata: {
          revision: 1,
          timestamp
        }
      }).
      then(async () => {
        assert.that(logMessages.length).is.equalTo(1);
        assert.that(logMessages[0]).is.atLeast({
          level: 'info',
          message: 'Received domain event.'
        });
      });
  });
});
