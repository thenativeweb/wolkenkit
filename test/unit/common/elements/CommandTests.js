'use strict';

const assert = require('assertthat'),
      uuid = require('uuidv4');

const { Command } = require('../../../../common/elements');

suite('Command', () => {
  /* eslint-disable no-new */
  test('throws an error when no context is given.', async () => {
    assert.that(() => {
      new Command({
        aggregate: {
          name: 'bar',
          id: uuid()
        },
        name: 'foo'
      });
    }).is.throwing('Context is missing.');
  });

  test('throws an error when no context name is given.', async () => {
    assert.that(() => {
      new Command({
        context: {},
        aggregate: {
          name: 'bar',
          id: uuid()
        },
        name: 'foo'
      });
    }).is.throwing('Context name is missing.');
  });

  test('throws an error when no aggregate is given.', async () => {
    assert.that(() => {
      new Command({
        context: {
          name: 'bar'
        },
        name: 'foo'
      });
    }).is.throwing('Aggregate is missing.');
  });

  test('throws an error when no aggregate name is given.', async () => {
    assert.that(() => {
      new Command({
        context: {
          name: 'bar'
        },
        aggregate: {
          id: uuid()
        },
        name: 'foo'
      });
    }).is.throwing('Aggregate name is missing.');
  });

  test('throws an error when no aggregate id is given.', async () => {
    assert.that(() => {
      new Command({
        context: {
          name: 'bar'
        },
        aggregate: {
          name: 'baz'
        },
        name: 'foo'
      });
    }).is.throwing('Aggregate id is missing.');
  });

  test('throws an error when no name is given.', async () => {
    assert.that(() => {
      new Command({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: uuid()
        }
      });
    }).is.throwing('Name is missing.');
  });

  test('throws an error when data is not an object.', async () => {
    assert.that(() => {
      new Command({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: uuid()
        },
        name: 'baz',
        data: 'foobarbaz'
      });
    }).is.throwing('Invalid type: string should be object (at command.data).');
  });

  test('throws an error when annotations is not an object.', async () => {
    assert.that(() => {
      new Command({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: uuid()
        },
        name: 'baz',
        annotations: 'foobarbaz'
      });
    }).is.throwing('Invalid type: string should be object (at command.annotations).');
  });

  test('returns a command.', async () => {
    const id = uuid();

    const actual = new Command({
      context: {
        name: 'foo'
      },
      aggregate: {
        name: 'bar',
        id
      },
      name: 'baz',
      data: {
        foo: 'foobarbaz'
      }
    });

    assert.that(actual).is.ofType('object');
    assert.that(actual.context.name).is.equalTo('foo');
    assert.that(actual.aggregate.name).is.equalTo('bar');
    assert.that(actual.aggregate.id).is.equalTo(id);
    assert.that(actual.name).is.equalTo('baz');
    assert.that(actual.id).is.ofType('string');
    assert.that(actual.data).is.equalTo({ foo: 'foobarbaz' });
    assert.that(actual.annotations).is.equalTo({});
    assert.that(actual.metadata.timestamp).is.ofType('number');
    assert.that(actual.metadata.correlationId).is.equalTo(actual.id);
    assert.that(actual.metadata.causationId).is.equalTo(actual.id);
  });

  test('returns a command with annotations.', async () => {
    const aggregateId = uuid(),
          userId = uuid();

    const actual = new Command({
      context: {
        name: 'foo'
      },
      aggregate: {
        name: 'bar',
        id: aggregateId
      },
      name: 'baz',
      data: {
        foo: 'foobarbaz'
      },
      annotations: {
        client: {
          token: '...',
          user: { id: userId, claims: { sub: userId }},
          ip: '127.0.0.1'
        }
      }
    });

    assert.that(actual).is.ofType('object');
    assert.that(actual.context.name).is.equalTo('foo');
    assert.that(actual.aggregate.name).is.equalTo('bar');
    assert.that(actual.aggregate.id).is.equalTo(aggregateId);
    assert.that(actual.name).is.equalTo('baz');
    assert.that(actual.id).is.ofType('string');
    assert.that(actual.data).is.equalTo({ foo: 'foobarbaz' });
    assert.that(actual.annotations).is.equalTo({
      client: {
        token: '...',
        user: { id: userId, claims: { sub: userId }},
        ip: '127.0.0.1'
      }
    });
    assert.that(actual.metadata.timestamp).is.ofType('number');
    assert.that(actual.metadata.correlationId).is.equalTo(actual.id);
    assert.that(actual.metadata.causationId).is.equalTo(actual.id);
  });
  /* eslint-enable no-new */

  suite('deserialize', () => {
    test('is a function.', async () => {
      assert.that(Command.deserialize).is.ofType('function');
    });

    test('returns a real command object.', async () => {
      const command = new Command({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: uuid()
        },
        name: 'baz',
        data: {
          foo: 'foobarbaz'
        }
      });

      const deserializedCommand = JSON.parse(JSON.stringify(command));

      const actual = Command.deserialize(deserializedCommand);

      assert.that(actual).is.instanceOf(Command);
    });

    test('throws an error when the original metadata are malformed.', async () => {
      const command = new Command({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: uuid()
        },
        name: 'baz',
        data: {
          foo: 'foobarbaz'
        }
      });

      const deserializedCommand = JSON.parse(JSON.stringify(command));

      deserializedCommand.metadata.timestamp = 'foo';

      assert.that(() => {
        Command.deserialize(deserializedCommand);
      }).is.throwing('Invalid type: string should be number (at command.metadata.timestamp).');
    });

    test('does not change original metadata.', async () => {
      const command = new Command({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: uuid()
        },
        name: 'baz',
        data: {
          foo: 'foobarbaz'
        }
      });

      const deserializedCommand = JSON.parse(JSON.stringify(command));

      const actual = Command.deserialize(deserializedCommand);

      assert.that(actual.id).is.equalTo(command.id);
      assert.that(actual.metadata.correlationId).is.equalTo(command.metadata.correlationId);
      assert.that(actual.metadata.causationId).is.equalTo(command.metadata.causationId);
      assert.that(actual.metadata.timestamp).is.equalTo(command.metadata.timestamp);
    });

    test('keeps annotations.', async () => {
      const userId = uuid();

      const command = new Command({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: uuid()
        },
        name: 'baz',
        data: {
          foo: 'foobarbaz'
        },
        annotations: {
          client: {
            token: '...',
            user: { id: userId, claims: { sub: userId }},
            ip: '127.0.0.1'
          }
        }
      });

      const deserializedCommand = JSON.parse(JSON.stringify(command));

      const actual = Command.deserialize(deserializedCommand);

      assert.that(actual.annotations).is.equalTo(command.annotations);
    });
  });

  suite('isWellformed', () => {
    test('is a function.', async () => {
      assert.that(Command.isWellformed).is.ofType('function');
    });

    test('returns false for non-object types.', async () => {
      assert.that(Command.isWellformed()).is.false();
    });

    test('returns false for an empty object.', async () => {
      assert.that(Command.isWellformed({})).is.false();
    });

    test('returns false when no context is given.', async () => {
      assert.that(Command.isWellformed({
        aggregate: {
          name: 'bar',
          id: '75e26d8a-f9d1-4083-a9c2-f61c84acf7e3'
        },
        name: 'baz',
        id: '8f64f9be-edc0-4196-b48d-8bf0e770843b',
        data: {
          foo: 'foobarbaz'
        },
        annotations: {},
        metadata: {
          timestamp: 1409334527796,
          correlationId: '8f64f9be-edc0-4196-b48d-8bf0e770843b',
          causationId: '8f64f9be-edc0-4196-b48d-8bf0e770843b'
        }
      })).is.false();
    });

    test('returns false when no context name is given.', async () => {
      assert.that(Command.isWellformed({
        context: {},
        aggregate: {
          name: 'bar',
          id: '75e26d8a-f9d1-4083-a9c2-f61c84acf7e3'
        },
        name: 'baz',
        id: '8f64f9be-edc0-4196-b48d-8bf0e770843b',
        data: {
          foo: 'foobarbaz'
        },
        annotations: {},
        metadata: {
          timestamp: 1409334527796,
          correlationId: '8f64f9be-edc0-4196-b48d-8bf0e770843b',
          causationId: '8f64f9be-edc0-4196-b48d-8bf0e770843b'
        }
      })).is.false();
    });

    test('returns false when no aggregate is given.', async () => {
      assert.that(Command.isWellformed({
        context: {
          name: 'foo'
        },
        name: 'baz',
        id: '8f64f9be-edc0-4196-b48d-8bf0e770843b',
        data: {
          foo: 'foobarbaz'
        },
        annotations: {},
        metadata: {
          timestamp: 1409334527796,
          correlationId: '8f64f9be-edc0-4196-b48d-8bf0e770843b',
          causationId: '8f64f9be-edc0-4196-b48d-8bf0e770843b'
        }
      })).is.false();
    });

    test('returns false when no aggregate name is given.', async () => {
      assert.that(Command.isWellformed({
        context: {
          name: 'foo'
        },
        aggregate: {
          id: '75e26d8a-f9d1-4083-a9c2-f61c84acf7e3'
        },
        name: 'baz',
        id: '8f64f9be-edc0-4196-b48d-8bf0e770843b',
        data: {
          foo: 'foobarbaz'
        },
        annotations: {},
        metadata: {
          timestamp: 1409334527796,
          correlationId: '8f64f9be-edc0-4196-b48d-8bf0e770843b',
          causationId: '8f64f9be-edc0-4196-b48d-8bf0e770843b'
        }
      })).is.false();
    });

    test('returns false when no aggregate id is given.', async () => {
      assert.that(Command.isWellformed({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar'
        },
        name: 'baz',
        id: '8f64f9be-edc0-4196-b48d-8bf0e770843b',
        data: {
          foo: 'foobarbaz'
        },
        annotations: {},
        metadata: {
          timestamp: 1409334527796,
          correlationId: '8f64f9be-edc0-4196-b48d-8bf0e770843b',
          causationId: '8f64f9be-edc0-4196-b48d-8bf0e770843b'
        }
      })).is.false();
    });

    test('returns false when no name is given.', async () => {
      assert.that(Command.isWellformed({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: '75e26d8a-f9d1-4083-a9c2-f61c84acf7e3'
        },
        id: '8f64f9be-edc0-4196-b48d-8bf0e770843b',
        data: {
          foo: 'foobarbaz'
        },
        annotations: {},
        metadata: {
          timestamp: 1409334527796,
          correlationId: '8f64f9be-edc0-4196-b48d-8bf0e770843b',
          causationId: '8f64f9be-edc0-4196-b48d-8bf0e770843b'
        }
      })).is.false();
    });

    test('returns false when no id is given.', async () => {
      assert.that(Command.isWellformed({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: '75e26d8a-f9d1-4083-a9c2-f61c84acf7e3'
        },
        name: 'baz',
        data: {
          foo: 'foobarbaz'
        },
        annotations: {},
        metadata: {
          timestamp: 1409334527796,
          correlationId: '8f64f9be-edc0-4196-b48d-8bf0e770843b',
          causationId: '8f64f9be-edc0-4196-b48d-8bf0e770843b'
        }
      })).is.false();
    });

    test('returns false when no data is given.', async () => {
      assert.that(Command.isWellformed({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: '75e26d8a-f9d1-4083-a9c2-f61c84acf7e3'
        },
        name: 'baz',
        id: '8f64f9be-edc0-4196-b48d-8bf0e770843b',
        annotations: {},
        metadata: {
          timestamp: 1409334527796,
          correlationId: '8f64f9be-edc0-4196-b48d-8bf0e770843b',
          causationId: '8f64f9be-edc0-4196-b48d-8bf0e770843b'
        }
      })).is.false();
    });

    test('returns false when no annotations are given.', async () => {
      assert.that(Command.isWellformed({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: '75e26d8a-f9d1-4083-a9c2-f61c84acf7e3'
        },
        name: 'baz',
        id: '8f64f9be-edc0-4196-b48d-8bf0e770843b',
        data: {
          foo: 'foobarbaz'
        },
        metadata: {
          timestamp: 1409334527796,
          correlationId: '8f64f9be-edc0-4196-b48d-8bf0e770843b',
          causationId: '8f64f9be-edc0-4196-b48d-8bf0e770843b'
        }
      })).is.false();
    });

    test('returns false when no metadata is given.', async () => {
      assert.that(Command.isWellformed({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: '75e26d8a-f9d1-4083-a9c2-f61c84acf7e3'
        },
        name: 'baz',
        id: '8f64f9be-edc0-4196-b48d-8bf0e770843b',
        data: {
          foo: 'foobarbaz'
        },
        annotations: {}
      })).is.false();
    });

    test('returns false when no timestamp is given.', async () => {
      assert.that(Command.isWellformed({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: '75e26d8a-f9d1-4083-a9c2-f61c84acf7e3'
        },
        name: 'baz',
        id: '8f64f9be-edc0-4196-b48d-8bf0e770843b',
        data: {
          foo: 'foobarbaz'
        },
        annotations: {},
        metadata: {
          correlationId: '8f64f9be-edc0-4196-b48d-8bf0e770843b',
          causationId: '8f64f9be-edc0-4196-b48d-8bf0e770843b'
        }
      })).is.false();
    });

    test('returns false when no correlation id is given.', async () => {
      assert.that(Command.isWellformed({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: '75e26d8a-f9d1-4083-a9c2-f61c84acf7e3'
        },
        name: 'baz',
        id: '8f64f9be-edc0-4196-b48d-8bf0e770843b',
        data: {
          foo: 'foobarbaz'
        },
        annotations: {},
        metadata: {
          timestamp: 1409334527796,
          causationId: '8f64f9be-edc0-4196-b48d-8bf0e770843b'
        }
      })).is.false();
    });

    test('returns false when no causation id is given.', async () => {
      assert.that(Command.isWellformed({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: '75e26d8a-f9d1-4083-a9c2-f61c84acf7e3'
        },
        name: 'baz',
        id: '8f64f9be-edc0-4196-b48d-8bf0e770843b',
        data: {
          foo: 'foobarbaz'
        },
        annotations: {},
        metadata: {
          timestamp: 1409334527796,
          correlationId: '8f64f9be-edc0-4196-b48d-8bf0e770843b'
        }
      })).is.false();
    });

    test('returns true when the command is well-formed.', async () => {
      assert.that(Command.isWellformed({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: '75e26d8a-f9d1-4083-a9c2-f61c84acf7e3'
        },
        name: 'baz',
        id: '8f64f9be-edc0-4196-b48d-8bf0e770843b',
        data: {
          foo: 'foobarbaz'
        },
        annotations: {},
        metadata: {
          timestamp: 1409334527796,
          correlationId: '8f64f9be-edc0-4196-b48d-8bf0e770843b',
          causationId: '8f64f9be-edc0-4196-b48d-8bf0e770843b'
        }
      })).is.true();
    });
  });
});
