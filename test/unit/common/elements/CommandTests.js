'use strict';

const assert = require('assertthat'),
      getOptionTests = require('get-option-tests'),
      uuid = require('uuidv4');

const { Command } = require('../../../../common/elements');

suite('Command', () => {
  suite('create', () => {
    test('is a function.', async () => {
      assert.that(Command.create).is.ofType('function');
    });

    getOptionTests({
      options: {
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'sampleCommand'
      },
      run (options) {
        Command.create(options);
      }
    });

    test('returns a command.', async () => {
      const aggregateId = uuid();

      const command = Command.create({
        context: {
          name: 'sampleContext'
        },
        aggregate: {
          name: 'sampleAggregate',
          id: aggregateId
        },
        name: 'sampleCommand',
        data: {
          foo: 'bar'
        }
      });

      assert.that(command).is.instanceOf(Command);
      assert.that(command.context.name).is.equalTo('sampleContext');
      assert.that(command.aggregate.name).is.equalTo('sampleAggregate');
      assert.that(command.aggregate.id).is.equalTo(aggregateId);
      assert.that(command.name).is.equalTo('sampleCommand');
      assert.that(command.id).is.ofType('string');
      assert.that(uuid.is(command.id)).is.true();
      assert.that(command.data).is.equalTo({ foo: 'bar' });
      assert.that(command.metadata.timestamp).is.ofType('number');
      assert.that(command.metadata.correlationId).is.equalTo(command.id);
      assert.that(command.metadata.causationId).is.equalTo(command.id);
      assert.that(command.annotations).is.equalTo({});
    });

    test('returns a command with annotations.', async () => {
      const aggregateId = uuid(),
            userId = uuid();

      const command = Command.create({
        context: {
          name: 'sampleContext'
        },
        aggregate: {
          name: 'sampleAggregate',
          id: aggregateId
        },
        name: 'sampleCommand',
        data: {
          foo: 'bar'
        },
        annotations: {
          client: {
            token: '...',
            user: { id: userId, claims: { sub: userId }},
            ip: '127.0.0.1'
          }
        }
      });

      assert.that(command).is.instanceOf(Command);
      assert.that(command.context.name).is.equalTo('sampleContext');
      assert.that(command.aggregate.name).is.equalTo('sampleAggregate');
      assert.that(command.aggregate.id).is.equalTo(aggregateId);
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
        }
      });
    });
  });

  suite('fromObject', () => {
    test('is a function.', async () => {
      assert.that(Command.fromObject).is.ofType('function');
    });

    getOptionTests({
      options: {
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'sampleCommand',
        id: uuid(),
        data: { foo: 'bar' },
        metadata: {
          timestamp: Date.now(),
          causationId: uuid(),
          correlationId: uuid()
        },
        annotations: {
          client: {
            token: '...',
            user: { id: uuid(), claims: { sub: uuid() }},
            ip: '127.0.0.1'
          }
        }
      },
      excludes: [ 'data.foo', 'annotations.client' ],
      run (options) {
        Command.fromObject(options);
      }
    });

    test('returns a real command object.', async () => {
      const command = Command.create({
        context: {
          name: 'sampleContext'
        },
        aggregate: {
          name: 'sampleAggregate',
          id: uuid()
        },
        name: 'sampleCommand',
        data: {
          foo: 'bar'
        }
      });

      const deserializedCommand = JSON.parse(JSON.stringify(command));

      const actual = Command.fromObject(deserializedCommand);

      assert.that(actual).is.instanceOf(Command);
    });

    test('throws an error when the original metadata are malformed.', async () => {
      const command = Command.create({
        context: {
          name: 'sampleContext'
        },
        aggregate: {
          name: 'sampleAggregate',
          id: uuid()
        },
        name: 'sampleCommand',
        data: {
          foo: 'bar'
        }
      });

      const deserializedCommand = JSON.parse(JSON.stringify(command));

      deserializedCommand.metadata.timestamp = 'malformed';

      assert.that(() => {
        Command.fromObject(deserializedCommand);
      }).is.throwing('Invalid type: string should be number (at command.metadata.timestamp).');
    });

    test('does not change original metadata.', async () => {
      const command = Command.create({
        context: {
          name: 'sampleContext'
        },
        aggregate: {
          name: 'sampleAggregate',
          id: uuid()
        },
        name: 'sampleCommand',
        data: {
          foo: 'bar'
        }
      });

      const deserializedCommand = JSON.parse(JSON.stringify(command));

      const actual = Command.fromObject(deserializedCommand);

      assert.that(actual.id).is.equalTo(command.id);
      assert.that(actual.metadata.correlationId).is.equalTo(command.metadata.correlationId);
      assert.that(actual.metadata.causationId).is.equalTo(command.metadata.causationId);
      assert.that(actual.metadata.timestamp).is.equalTo(command.metadata.timestamp);
    });

    test('keeps annotations.', async () => {
      const command = Command.create({
        context: {
          name: 'sampleContext'
        },
        aggregate: {
          name: 'sampleAggregate',
          id: uuid()
        },
        name: 'sampleCommand',
        data: {
          foo: 'bar'
        },
        annotations: {
          client: {
            token: '...',
            user: { id: uuid(), claims: { sub: uuid() }},
            ip: '127.0.0.1'
          }
        }
      });

      const deserializedCommand = JSON.parse(JSON.stringify(command));

      const actual = Command.fromObject(deserializedCommand);

      assert.that(actual.annotations).is.equalTo(command.annotations);
    });
  });

  suite('instance', () => {
    let command;

    setup(async () => {
      const userId = uuid();

      command = Command.create({
        context: {
          name: 'sampleContext'
        },
        aggregate: {
          name: 'sampleAggregate',
          id: uuid()
        },
        name: 'sampleCommand',
        data: {
          foo: 'bar'
        },
        annotations: {
          client: {
            token: '...',
            user: { id: userId, claims: { sub: userId }},
            ip: '127.0.0.1'
          }
        }
      });
    });

    suite('clone', () => {
      test('is a function.', async () => {
        assert.that(command.clone).is.ofType('function');
      });

      test('returns a cloned command.', async () => {
        const clonedCommand = command.clone();

        assert.that(clonedCommand).is.equalTo(command);
        assert.that(clonedCommand).is.not.sameAs(command);
      });
    });

    suite('withoutAnnotations', () => {
      test('is a function.', async () => {
        assert.that(command.withoutAnnotations).is.ofType('function');
      });

      test('returns a new command without annotations.', async () => {
        const commandWithoutAnnotations = command.withoutAnnotations();

        assert.that(commandWithoutAnnotations).is.not.sameAs(command);
        assert.that(commandWithoutAnnotations.context).is.equalTo(command.context);
        assert.that(commandWithoutAnnotations.aggregate).is.equalTo(command.aggregate);
        assert.that(commandWithoutAnnotations.name).is.equalTo(command.name);
        assert.that(commandWithoutAnnotations.id).is.equalTo(command.id);
        assert.that(commandWithoutAnnotations.data).is.equalTo(command.data);
        assert.that(commandWithoutAnnotations.metadata).is.equalTo(command.metadata);
      });
    });
  });
});
