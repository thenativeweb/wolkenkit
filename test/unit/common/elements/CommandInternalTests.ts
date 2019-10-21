import Application from '../../../../lib/common/application';
import assert from 'assertthat';
import CommandInternal from '../../../../lib/common/elements/CommandInternal';
import path from 'path';
import uuid from 'uuidv4';

suite('CommandInternal', (): void => {
  suite('create', (): void => {
    test('returns a command.', async (): Promise<void> => {
      const aggregateId = uuid(),
            userId = uuid();

      const command = CommandInternal.create({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: aggregateId },
        name: 'sampleCommand',
        data: {
          foo: 'bar'
        },
        annotations: {
          client: {
            token: '...',
            user: { id: userId, claims: { sub: userId }},
            ip: '127.0.0.1'
          },
          initiator: { user: { id: userId, claims: { sub: userId }}}
        }
      });

      assert.that(command.contextIdentifier.name).is.equalTo('sampleContext');
      assert.that(command.aggregateIdentifier.name).is.equalTo('sampleAggregate');
      assert.that(command.aggregateIdentifier.id).is.equalTo(aggregateId);
      assert.that(command.name).is.equalTo('sampleCommand');
      assert.that(command.id).is.ofType('string');
      assert.that(uuid.is(command.id)).is.true();
      assert.that(command.data).is.equalTo({ foo: 'bar' });
      assert.that(command.metadata.timestamp).is.ofType('number');
      assert.that(command.metadata.correlationId).is.equalTo(command.id);
      assert.that(command.metadata.causationId).is.equalTo(command.id);
      assert.that(command.annotations).is.equalTo({
        client: {
          token: '...',
          user: { id: userId, claims: { sub: userId }},
          ip: '127.0.0.1'
        },
        initiator: { user: { id: userId, claims: { sub: userId }}}
      });
    });
  });

  suite('deserialize', (): void => {
    test('returns a real command object.', async (): Promise<void> => {
      const command = CommandInternal.create({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
        name: 'sampleCommand',
        data: {
          foo: 'bar'
        },
        annotations: {
          client: {
            token: '...',
            user: { id: uuid(), claims: { sub: uuid() }},
            ip: '127.0.0.1'
          },
          initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
        }
      });

      const deserializedCommand = JSON.parse(JSON.stringify(command));
      const actual = CommandInternal.deserialize(deserializedCommand);

      assert.that(actual).is.equalTo(deserializedCommand);
    });

    test('throws an error when the original metadata are malformed.', async (): Promise<void> => {
      const command = CommandInternal.create({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
        name: 'sampleCommand',
        data: {
          foo: 'bar'
        },
        annotations: {
          client: {
            token: '...',
            user: { id: uuid(), claims: { sub: uuid() }},
            ip: '127.0.0.1'
          },
          initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
        }
      });

      const deserializedCommand = JSON.parse(JSON.stringify(command));

      deserializedCommand.metadata.timestamp = 'malformed';

      assert.that((): void => {
        CommandInternal.deserialize(deserializedCommand);
      }).is.throwing('Invalid type: string should be number (at command.metadata.timestamp).');
    });

    test('does not change original metadata.', async (): Promise<void> => {
      const command = CommandInternal.create({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
        name: 'sampleCommand',
        data: {
          foo: 'bar'
        },
        annotations: {
          client: {
            token: '...',
            user: { id: uuid(), claims: { sub: uuid() }},
            ip: '127.0.0.1'
          },
          initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
        }
      });

      const deserializedCommand = JSON.parse(JSON.stringify(command));

      const actual = CommandInternal.deserialize(deserializedCommand);

      assert.that(actual.id).is.equalTo(command.id);
      assert.that(actual.metadata.correlationId).is.equalTo(command.metadata.correlationId);
      assert.that(actual.metadata.causationId).is.equalTo(command.metadata.causationId);
      assert.that(actual.metadata.timestamp).is.equalTo(command.metadata.timestamp);
    });

    test('do not change original annotations.', async (): Promise<void> => {
      const command = CommandInternal.create({
        contextIdentifier: {
          name: 'sampleContext'
        },
        aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
        name: 'sampleCommand',
        data: {
          foo: 'bar'
        },
        annotations: {
          client: {
            token: '...',
            user: { id: uuid(), claims: { sub: uuid() }},
            ip: '127.0.0.1'
          },
          initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
        }
      });

      const deserializedCommand = JSON.parse(JSON.stringify(command));
      const actual = CommandInternal.deserialize(deserializedCommand);

      assert.that(actual.annotations).is.equalTo(command.annotations);
    });
  });

  suite('validate', (): void => {
    let application: Application;

    setup(async (): Promise<void> => {
      const directory = path.join(__dirname, '..', '..', '..', 'shared', 'applications', 'base');

      application = await Application.load({ directory });
    });

    test('throws an error if command is malformed.', async (): Promise<void> => {
      assert.that((): void => {
        CommandInternal.validate({ command: {}, application });
      }).is.throwing('Command malformed.');
    });

    test('throws an error if context name is invalid.', async (): Promise<void> => {
      assert.that((): void => {
        CommandInternal.validate({
          command: CommandInternal.create({
            contextIdentifier: { name: 'nonExistent' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'execute',
            annotations: {
              client: { token: '...', user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}, ip: '127.0.0.1' },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            }
          }),
          application
        });
      }).is.throwing('Invalid context name.');
    });

    test('throws an error if aggregate name is invalid.', async (): Promise<void> => {
      assert.that((): void => {
        CommandInternal.validate({
          command: CommandInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'nonExistent', id: uuid() },
            name: 'execute',
            annotations: {
              client: { token: '...', user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}, ip: '127.0.0.1' },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            }
          }),
          application
        });
      }).is.throwing('Invalid aggregate name.');
    });

    test('throws an error if command name is invalid.', async (): Promise<void> => {
      assert.that((): void => {
        CommandInternal.validate({
          command: CommandInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'nonExistent',
            annotations: {
              client: { token: '...', user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}, ip: '127.0.0.1' },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            }
          }),
          application
        });
      }).is.throwing('Invalid command name.');
    });

    test('throws an error if the schema does not match.', async (): Promise<void> => {
      assert.that((): void => {
        CommandInternal.validate({
          command: CommandInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'execute',
            data: { strategy: 'nonExistent' },
            annotations: {
              client: { token: '...', user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}, ip: '127.0.0.1' },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            }
          }),
          application
        });
      }).is.throwing('No enum match (nonExistent), expects: succeed, fail, reject (at command.data.strategy).');
    });

    test('does not throw an error if the schema matches.', async (): Promise<void> => {
      assert.that((): void => {
        CommandInternal.validate({
          command: CommandInternal.create({
            contextIdentifier: { name: 'sampleContext' },
            aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
            name: 'execute',
            data: { strategy: 'succeed' },
            annotations: {
              client: { token: '...', user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}, ip: '127.0.0.1' },
              initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
            }
          }),
          application
        });
      }).is.not.throwing();
    });
  });
});
