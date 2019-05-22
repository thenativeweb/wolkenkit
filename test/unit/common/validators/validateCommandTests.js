'use strict';

const path = require('path');

const assert = require('assertthat'),
      uuid = require('uuidv4');

const { Application } = require('../../../../common/application'),
      { Command } = require('../../../../common/elements'),
      { validateCommand } = require('../../../../common/validators');

suite('validateCommand', () => {
  let application;

  setup(async () => {
    const directory = path.join(__dirname, '..', '..', '..', 'shared', 'applications', 'base');

    application = await Application.load({ directory });
  });

  test('is a function.', async () => {
    assert.that(validateCommand).is.ofType('function');
  });

  test('throws an error if command is missing.', async () => {
    assert.that(() => {
      validateCommand({ application });
    }).is.throwing('Command is missing.');
  });

  test('throws an error if application is missing.', async () => {
    assert.that(() => {
      validateCommand({ command: {}});
    }).is.throwing('Application is missing.');
  });

  test('throws an error if command is malformed.', async () => {
    assert.that(() => {
      validateCommand({ command: {}, application });
    }).is.throwing('Malformed command.');
  });

  test('throws an error if context name is invalid.', async () => {
    assert.that(() => {
      validateCommand({
        command: Command.create({
          context: { name: 'nonExistent' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'execute'
        }),
        application
      });
    }).is.throwing('Invalid context name.');
  });

  test('throws an error if aggregate name is invalid.', async () => {
    assert.that(() => {
      validateCommand({
        command: Command.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'nonExistent', id: uuid() },
          name: 'execute'
        }),
        application
      });
    }).is.throwing('Invalid aggregate name.');
  });

  test('throws an error if command name is invalid.', async () => {
    assert.that(() => {
      validateCommand({
        command: Command.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'nonExistent'
        }),
        application
      });
    }).is.throwing('Invalid command name.');
  });

  test('throws an error if the schema does not match.', async () => {
    assert.that(() => {
      validateCommand({
        command: Command.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'nonExistent' }
        }),
        application
      });
    }).is.throwing('No enum match (nonExistent), expects: succeed, fail, reject (at command.data.strategy).');
  });

  test('does not throw an error if the schema matches.', async () => {
    assert.that(() => {
      validateCommand({
        command: Command.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' }
        }),
        application
      });
    }).is.not.throwing();
  });
});
