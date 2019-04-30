'use strict';

const assert = require('assertthat');

const { Command } = require('../../../../common/elements');

suite('Command', () => {
  /* eslint-disable no-new */
  test('throws an error when no context is given.', async () => {
    assert.that(() => {
      new Command({
        aggregate: {
          name: 'bar',
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
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
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
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
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
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
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
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
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
        },
        name: 'baz',
        data: 'foobarbaz'
      });
    }).is.throwing('Invalid type: string should be object (at command.data).');
  });

  test('throws an error when custom is not an object.', async () => {
    assert.that(() => {
      new Command({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
        },
        name: 'baz',
        custom: 'foobarbaz'
      });
    }).is.throwing('Invalid type: string should be object (at command.custom).');
  });

  test('returns a command.', async () => {
    const actual = new Command({
      context: {
        name: 'foo'
      },
      aggregate: {
        name: 'bar',
        id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
      },
      name: 'baz',
      data: {
        foo: 'foobarbaz'
      }
    });

    assert.that(actual).is.ofType('object');
    assert.that(actual.context.name).is.equalTo('foo');
    assert.that(actual.aggregate.name).is.equalTo('bar');
    assert.that(actual.aggregate.id).is.equalTo('85932442-bf87-472d-8b5a-b0eac3aa8be9');
    assert.that(actual.name).is.equalTo('baz');
    assert.that(actual.id).is.ofType('string');
    assert.that(actual.data).is.equalTo({ foo: 'foobarbaz' });
    assert.that(actual.custom).is.equalTo({});
    assert.that(actual.initiator).is.null();
    assert.that(actual.metadata.timestamp).is.ofType('number');
    assert.that(actual.metadata.correlationId).is.equalTo(actual.id);
    assert.that(actual.metadata.causationId).is.equalTo(actual.id);
  });

  test('returns a command with custom data.', async () => {
    const actual = new Command({
      context: {
        name: 'foo'
      },
      aggregate: {
        name: 'bar',
        id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
      },
      name: 'baz',
      data: {
        foo: 'foobarbaz'
      },
      custom: {
        foo: 'custom-foobar'
      }
    });

    assert.that(actual).is.ofType('object');
    assert.that(actual.context.name).is.equalTo('foo');
    assert.that(actual.aggregate.name).is.equalTo('bar');
    assert.that(actual.aggregate.id).is.equalTo('85932442-bf87-472d-8b5a-b0eac3aa8be9');
    assert.that(actual.name).is.equalTo('baz');
    assert.that(actual.id).is.ofType('string');
    assert.that(actual.data).is.equalTo({ foo: 'foobarbaz' });
    assert.that(actual.custom).is.equalTo({ foo: 'custom-foobar' });
    assert.that(actual.initiator).is.null();
    assert.that(actual.metadata.timestamp).is.ofType('number');
    assert.that(actual.metadata.correlationId).is.equalTo(actual.id);
    assert.that(actual.metadata.causationId).is.equalTo(actual.id);
  });
  /* eslint-enable no-new */

  suite('addInitiator', () => {
    let command;

    setup(() => {
      command = new Command({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
        },
        name: 'baz',
        data: {
          foo: 'foobarbaz'
        }
      });
    });

    test('is a function.', async () => {
      assert.that(command.addInitiator).is.ofType('function');
    });

    test('throws an error if token is missing.', async () => {
      assert.that(() => {
        command.addInitiator({});
      }).is.throwing('Token is missing.');
    });

    test('adds the token.', async () => {
      command.addInitiator({ token: { sub: 'Jane Doe' }});

      assert.that(command.initiator.token).is.equalTo({ sub: 'Jane Doe' });
    });

    test('sets sub as the initiator id.', async () => {
      command.addInitiator({ token: { sub: 'Jane Doe' }});

      assert.that(command.initiator.id).is.equalTo('Jane Doe');
    });
  });

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
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
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
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
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
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
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

    test('keeps custom data.', async () => {
      const command = new Command({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
        },
        name: 'baz',
        data: {
          foo: 'foobarbaz'
        },
        custom: {
          foo: 'custom-foobar'
        }
      });

      const deserializedCommand = JSON.parse(JSON.stringify(command));

      const actual = Command.deserialize(deserializedCommand);

      assert.that(actual.custom).is.equalTo(command.custom);
    });

    test('keeps initiator data.', async () => {
      const command = new Command({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
        },
        name: 'baz',
        data: {
          foo: 'foobarbaz'
        }
      });

      command.addInitiator({ token: { sub: 'Jane Doe' }});

      const deserializedCommand = JSON.parse(JSON.stringify(command));

      const actual = Command.deserialize(deserializedCommand);

      assert.that(actual.initiator).is.equalTo(command.initiator);
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
        custom: {},
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
        custom: {},
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
        custom: {},
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
        custom: {},
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
        custom: {},
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
        custom: {},
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
        custom: {},
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
        custom: {},
        metadata: {
          timestamp: 1409334527796,
          correlationId: '8f64f9be-edc0-4196-b48d-8bf0e770843b',
          causationId: '8f64f9be-edc0-4196-b48d-8bf0e770843b'
        }
      })).is.false();
    });

    test('returns false when no custom data is given.', async () => {
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
        custom: {}
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
        custom: {},
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
        custom: {},
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
        custom: {},
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
        custom: {},
        initiator: {
          id: '3815e5b5-3d79-4875-bac2-7a1c9f88048b',
          token: {
            sub: '3815e5b5-3d79-4875-bac2-7a1c9f88048b'
          }
        },
        metadata: {
          timestamp: 1409334527796,
          correlationId: '8f64f9be-edc0-4196-b48d-8bf0e770843b',
          causationId: '8f64f9be-edc0-4196-b48d-8bf0e770843b'
        }
      })).is.true();
    });
  });
});
