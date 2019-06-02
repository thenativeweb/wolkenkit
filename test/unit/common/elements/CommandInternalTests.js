'use strict';

const path = require('path');

const assert = require('assertthat'),
      getOptionTests = require('get-option-tests'),
      uuid = require('uuidv4');

const { Application } = require('../../../../common/application'),
      { CommandInternal } = require('../../../../common/elements');

suite('CommandInternal', () => {
  suite('create', () => {
    test('is a function.', async () => {
      assert.that(CommandInternal.create).is.ofType('function');
    });

    getOptionTests({
      options: {
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'sampleCommand',
        annotations: {
          client: {
            token: '...',
            user: { id: uuid(), claims: { sub: uuid() }},
            ip: '127.0.0.1'
          },
          initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
        }
      },
      excludes: [ 'annotations.client.*', 'annotations.initiator.*' ],
      run (options) {
        CommandInternal.create(options);
      }
    });

    test('returns a command.', async () => {
      const aggregateId = uuid(),
            userId = uuid();

      const command = CommandInternal.create({
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
          },
          initiator: { user: { id: userId, claims: { sub: userId }}}
        }
      });

      assert.that(command).is.instanceOf(CommandInternal);
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
        },
        initiator: { user: { id: userId, claims: { sub: userId }}}
      });
    });
  });

  suite('fromObject', () => {
    test('is a function.', async () => {
      assert.that(CommandInternal.fromObject).is.ofType('function');
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
          },
          initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
        }
      },
      excludes: [ 'data.*', 'annotations.*' ],
      run (options) {
        CommandInternal.fromObject(options);
      }
    });

    test('returns a real command object.', async () => {
      const command = CommandInternal.create({
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
          },
          initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
        }
      });

      const deserializedCommand = JSON.parse(JSON.stringify(command));
      const actual = CommandInternal.fromObject(deserializedCommand);

      assert.that(actual).is.instanceOf(CommandInternal);
    });

    test('throws an error when the original metadata are malformed.', async () => {
      const command = CommandInternal.create({
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
          },
          initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
        }
      });

      const deserializedCommand = JSON.parse(JSON.stringify(command));

      deserializedCommand.metadata.timestamp = 'malformed';

      assert.that(() => {
        CommandInternal.fromObject(deserializedCommand);
      }).is.throwing('Invalid type: string should be number (at command.metadata.timestamp).');
    });

    test('does not change original metadata.', async () => {
      const command = CommandInternal.create({
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
          },
          initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
        }
      });

      const deserializedCommand = JSON.parse(JSON.stringify(command));

      const actual = CommandInternal.fromObject(deserializedCommand);

      assert.that(actual.id).is.equalTo(command.id);
      assert.that(actual.metadata.correlationId).is.equalTo(command.metadata.correlationId);
      assert.that(actual.metadata.causationId).is.equalTo(command.metadata.causationId);
      assert.that(actual.metadata.timestamp).is.equalTo(command.metadata.timestamp);
    });

    test('do not change original annotations.', async () => {
      const command = CommandInternal.create({
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
          },
          initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
        }
      });

      const deserializedCommand = JSON.parse(JSON.stringify(command));
      const actual = CommandInternal.fromObject(deserializedCommand);

      assert.that(actual.annotations).is.equalTo(command.annotations);
    });
  });

  suite('validate', () => {
    let application;

    setup(async () => {
      const directory = path.join(__dirname, '..', '..', '..', 'shared', 'applications', 'base');

      application = await Application.load({ directory });
    });

    test('is a function.', async () => {
      assert.that(CommandInternal.validate).is.ofType('function');
    });

    getOptionTests({
      options: {
        command: {},
        application: {}
      },
      run (options) {
        CommandInternal.validate(options);
      }
    });

    test('throws an error if command is malformed.', async () => {
      assert.that(() => {
        CommandInternal.validate({ command: {}, application });
      }).is.throwing('Malformed command.');
    });

    test('throws an error if context name is invalid.', async () => {
      assert.that(() => {
        CommandInternal.validate({
          command: CommandInternal.create({
            context: { name: 'nonExistent' },
            aggregate: { name: 'sampleAggregate', id: uuid() },
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

    test('throws an error if aggregate name is invalid.', async () => {
      assert.that(() => {
        CommandInternal.validate({
          command: CommandInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'nonExistent', id: uuid() },
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

    test('throws an error if command name is invalid.', async () => {
      assert.that(() => {
        CommandInternal.validate({
          command: CommandInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: uuid() },
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

    test('throws an error if the schema does not match.', async () => {
      assert.that(() => {
        CommandInternal.validate({
          command: CommandInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: uuid() },
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

    test('does not throw an error if the schema matches.', async () => {
      assert.that(() => {
        CommandInternal.validate({
          command: CommandInternal.create({
            context: { name: 'sampleContext' },
            aggregate: { name: 'sampleAggregate', id: uuid() },
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
