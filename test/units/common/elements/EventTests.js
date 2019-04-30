'use strict';

const assert = require('assertthat');

const { Event } = require('../../../../common/elements');

suite('Event', () => {
  /* eslint-disable no-new */
  test('throws an error when no context is given.', async () => {
    assert.that(() => {
      new Event({
        aggregate: {
          name: 'bar',
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
        },
        name: 'foo',
        metadata: {
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1'
        }
      });
    }).is.throwing('Context is missing.');
  });

  test('throws an error when no context name is given.', async () => {
    assert.that(() => {
      new Event({
        context: {},
        aggregate: {
          name: 'bar',
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
        },
        name: 'foo',
        metadata: {
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1'
        }
      });
    }).is.throwing('Context name is missing.');
  });

  test('throws an error when no aggregate is given.', async () => {
    assert.that(() => {
      new Event({
        context: {
          name: 'bar'
        },
        name: 'foo',
        metadata: {
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1'
        }
      });
    }).is.throwing('Aggregate is missing.');
  });

  test('throws an error when no aggregate name is given.', async () => {
    assert.that(() => {
      new Event({
        context: {
          name: 'bar'
        },
        aggregate: {
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
        },
        name: 'foo',
        metadata: {
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1'
        }
      });
    }).is.throwing('Aggregate name is missing.');
  });

  test('throws an error when no aggregate id is given.', async () => {
    assert.that(() => {
      new Event({
        context: {
          name: 'bar'
        },
        aggregate: {
          name: 'baz'
        },
        name: 'foo',
        metadata: {
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1'
        }
      });
    }).is.throwing('Aggregate id is missing.');
  });

  test('throws an error when no event name is given.', async () => {
    assert.that(() => {
      new Event({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
        },
        metadata: {
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1'
        }
      });
    }).is.throwing('Event name is missing.');
  });

  test('throws an error when type is not a string.', async () => {
    assert.that(() => {
      new Event({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
        },
        name: 'foo',
        type: 23,
        metadata: {
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1'
        }
      });
    }).is.throwing('Invalid type: integer should be string (at event.type).');
  });

  test('throws an error when data is not an object.', async () => {
    assert.that(() => {
      new Event({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
        },
        name: 'foo',
        data: 'foobarbaz',
        metadata: {
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1'
        }
      });
    }).is.throwing('Invalid type: string should be object (at event.data).');
  });

  test('throws an error when no metadata are given.', async () => {
    assert.that(() => {
      new Event({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
        },
        name: 'foo'
      });
    }).is.throwing('Metadata are missing.');
  });

  test('throws an error when no correlation id is given.', async () => {
    assert.that(() => {
      new Event({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
        },
        name: 'foo',
        metadata: {
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1'
        }
      });
    }).is.throwing();
  });

  test('throws an error when no causation id is given.', async () => {
    assert.that(() => {
      new Event({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
        },
        name: 'foo',
        metadata: {
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1'
        }
      });
    }).is.throwing();
  });

  test('throws an error when custom is not an object.', async () => {
    assert.that(() => {
      new Event({
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
        custom: 'foobarbaz',
        metadata: {
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1'
        }
      });
    }).is.throwing('Invalid type: string should be object (at event.custom).');
  });

  test('returns an event.', async () => {
    const actual = new Event({
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
      metadata: {
        correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
        causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1'
      }
    });

    assert.that(actual).is.ofType('object');
    assert.that(actual.context.name).is.equalTo('foo');
    assert.that(actual.aggregate.name).is.equalTo('bar');
    assert.that(actual.aggregate.id).is.equalTo('85932442-bf87-472d-8b5a-b0eac3aa8be9');
    assert.that(actual.name).is.equalTo('baz');
    assert.that(actual.id).is.ofType('string');
    assert.that(actual.type).is.equalTo('domain');
    assert.that(actual.data).is.equalTo({ foo: 'foobarbaz' });
    assert.that(actual.custom).is.equalTo({});
    assert.that(actual.initiator).is.null();
    assert.that(actual.metadata.timestamp).is.ofType('number');
    assert.that(actual.metadata.published).is.false();
    assert.that(actual.metadata.correlationId).is.equalTo('5be0cef4-9051-44ca-a18c-a57c48d711c1');
    assert.that(actual.metadata.causationId).is.equalTo('5be0cef4-9051-44ca-a18c-a57c48d711c1');
  });

  test('returns an event with custom data.', async () => {
    const actual = new Event({
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
      },
      metadata: {
        correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
        causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1'
      }
    });

    assert.that(actual).is.ofType('object');
    assert.that(actual.context.name).is.equalTo('foo');
    assert.that(actual.aggregate.name).is.equalTo('bar');
    assert.that(actual.aggregate.id).is.equalTo('85932442-bf87-472d-8b5a-b0eac3aa8be9');
    assert.that(actual.name).is.equalTo('baz');
    assert.that(actual.id).is.ofType('string');
    assert.that(actual.type).is.equalTo('domain');
    assert.that(actual.data).is.equalTo({ foo: 'foobarbaz' });
    assert.that(actual.custom).is.equalTo({ foo: 'custom-foobar' });
    assert.that(actual.initiator).is.null();
    assert.that(actual.metadata.timestamp).is.ofType('number');
    assert.that(actual.metadata.published).is.false();
    assert.that(actual.metadata.correlationId).is.equalTo('5be0cef4-9051-44ca-a18c-a57c48d711c1');
    assert.that(actual.metadata.causationId).is.equalTo('5be0cef4-9051-44ca-a18c-a57c48d711c1');
  });

  test('returns an event with a custom type.', async () => {
    const actual = new Event({
      context: {
        name: 'foo'
      },
      aggregate: {
        name: 'bar',
        id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
      },
      name: 'baz',
      type: 'error',
      data: {
        foo: 'foobarbaz'
      },
      metadata: {
        correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
        causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1'
      }
    });

    assert.that(actual).is.ofType('object');
    assert.that(actual.context.name).is.equalTo('foo');
    assert.that(actual.aggregate.name).is.equalTo('bar');
    assert.that(actual.aggregate.id).is.equalTo('85932442-bf87-472d-8b5a-b0eac3aa8be9');
    assert.that(actual.name).is.equalTo('baz');
    assert.that(actual.id).is.ofType('string');
    assert.that(actual.type).is.equalTo('error');
    assert.that(actual.data).is.equalTo({ foo: 'foobarbaz' });
    assert.that(actual.initiator).is.null();
    assert.that(actual.metadata.timestamp).is.ofType('number');
    assert.that(actual.metadata.published).is.false();
    assert.that(actual.metadata.correlationId).is.equalTo('5be0cef4-9051-44ca-a18c-a57c48d711c1');
    assert.that(actual.metadata.causationId).is.equalTo('5be0cef4-9051-44ca-a18c-a57c48d711c1');
  });

  suite('addInitiator', () => {
    let event;

    setup(() => {
      event = new Event({
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
        metadata: {
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1'
        }
      });
    });

    test('is a function.', async () => {
      assert.that(event.addInitiator).is.ofType('function');
    });

    test('throws an error if initiator is missing.', async () => {
      assert.that(() => {
        event.addInitiator();
      }).is.throwing('Initiator is missing.');
    });

    test('throws an error if initiator id is missing.', async () => {
      assert.that(() => {
        event.addInitiator({});
      }).is.throwing('Initiator id is missing.');
    });

    test('adds the initiator.', async () => {
      event.addInitiator({ id: 'Jane Doe' });

      assert.that(event.initiator).is.equalTo({ id: 'Jane Doe' });
    });
  });

  suite('deserialize', () => {
    test('is a function.', async () => {
      assert.that(Event.deserialize).is.ofType('function');
    });

    test('returns a real event object.', async () => {
      const event = new Event({
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
        metadata: {
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1'
        }
      });

      const deserializedEvent = JSON.parse(JSON.stringify(event));

      const actual = Event.deserialize(deserializedEvent);

      assert.that(actual).is.instanceOf(Event);
    });

    test('throws an error when the original metadata are malformed.', async () => {
      const event = new Event({
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
        metadata: {
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1'
        }
      });

      const deserializedEvent = JSON.parse(JSON.stringify(event));

      deserializedEvent.metadata.timestamp = 'foo';

      assert.that(() => {
        Event.deserialize(deserializedEvent);
      }).is.throwing('Invalid type: string should be number (at event.metadata.timestamp).');
    });

    test('does not change original metadata.', async () => {
      const event = new Event({
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
        metadata: {
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1'
        }
      });

      event.metadata.hash = 'cc762e69089ee2393b061ab26a005319bda94744';
      event.metadata.hashPredecessor = 'fe10566e2adeece8faf585a8fbd5db896e4a60f7';

      const deserializedEvent = JSON.parse(JSON.stringify(event));

      const actual = Event.deserialize(deserializedEvent);

      assert.that(actual.id).is.equalTo(event.id);
      assert.that(actual.metadata.correlationId).is.equalTo(event.metadata.correlationId);
      assert.that(actual.metadata.causationId).is.equalTo(event.metadata.causationId);
      assert.that(actual.metadata.timestamp).is.equalTo(event.metadata.timestamp);
      assert.that(actual.metadata.hash).is.equalTo(event.metadata.hash);
      assert.that(actual.metadata.hashPredecessor).is.equalTo(event.metadata.hashPredecessor);
    });

    test('keeps custom data.', async () => {
      const event = new Event({
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
        metadata: {
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1'
        },
        custom: {
          foo: 'custom-foobar'
        }
      });

      const deserializedEvent = JSON.parse(JSON.stringify(event));

      const actual = Event.deserialize(deserializedEvent);

      assert.that(actual.custom).is.equalTo(event.custom);
    });

    test('keeps initiator data.', async () => {
      const event = new Event({
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
        metadata: {
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1'
        }
      });

      event.addInitiator({
        id: 'Jane Doe'
      });

      const deserializedEvent = JSON.parse(JSON.stringify(event));

      const actual = Event.deserialize(deserializedEvent);

      assert.that(actual.initiator).is.equalTo(event.initiator);
    });
  });

  suite('isWellformed', () => {
    test('is a function.', async () => {
      assert.that(Event.isWellformed).is.ofType('function');
    });

    test('returns false for non-object types.', async () => {
      assert.that(Event.isWellformed()).is.false();
    });

    test('returns false for an empty object.', async () => {
      assert.that(Event.isWellformed({})).is.false();
    });

    test('returns false when no context is given.', async () => {
      assert.that(Event.isWellformed({
        aggregate: {
          name: 'bar',
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
        },
        name: 'baz',
        id: '37ab3da0-3d04-469b-827d-44230cec53e2',
        type: 'foobar',
        data: {
          foo: 'foobarbaz'
        },
        metadata: {
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          timestamp: Date.now(),
          published: true
        },
        custom: {
          foo: 'custom-foobar'
        }
      })).is.false();
    });

    test('returns false when no context name is given.', async () => {
      assert.that(Event.isWellformed({
        context: {},
        aggregate: {
          name: 'bar',
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
        },
        name: 'baz',
        id: '37ab3da0-3d04-469b-827d-44230cec53e2',
        type: 'foobar',
        data: {
          foo: 'foobarbaz'
        },
        metadata: {
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          timestamp: Date.now(),
          published: true
        },
        custom: {
          foo: 'custom-foobar'
        }
      })).is.false();
    });

    test('returns false when no aggregate is given.', async () => {
      assert.that(Event.isWellformed({
        context: {
          name: 'foo'
        },
        name: 'baz',
        id: '37ab3da0-3d04-469b-827d-44230cec53e2',
        type: 'foobar',
        data: {
          foo: 'foobarbaz'
        },
        metadata: {
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          timestamp: Date.now(),
          published: true
        },
        custom: {
          foo: 'custom-foobar'
        }
      })).is.false();
    });

    test('returns false when no aggregate name is given.', async () => {
      assert.that(Event.isWellformed({
        context: {
          name: 'foo'
        },
        aggregate: {
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
        },
        name: 'baz',
        id: '37ab3da0-3d04-469b-827d-44230cec53e2',
        type: 'foobar',
        data: {
          foo: 'foobarbaz'
        },
        metadata: {
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          timestamp: Date.now(),
          published: true
        },
        custom: {
          foo: 'custom-foobar'
        }
      })).is.false();
    });

    test('returns false when no aggregate id is given.', async () => {
      assert.that(Event.isWellformed({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar'
        },
        name: 'baz',
        id: '37ab3da0-3d04-469b-827d-44230cec53e2',
        type: 'foobar',
        data: {
          foo: 'foobarbaz'
        },
        metadata: {
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          timestamp: Date.now(),
          published: true
        },
        custom: {
          foo: 'custom-foobar'
        }
      })).is.false();
    });

    test('returns false when no name is given.', async () => {
      assert.that(Event.isWellformed({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
        },
        id: '37ab3da0-3d04-469b-827d-44230cec53e2',
        type: 'foobar',
        data: {
          foo: 'foobarbaz'
        },
        metadata: {
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          timestamp: Date.now(),
          published: true
        },
        custom: {
          foo: 'custom-foobar'
        }
      })).is.false();
    });

    test('returns false when no id is given.', async () => {
      assert.that(Event.isWellformed({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
        },
        name: 'baz',
        type: 'foobar',
        data: {
          foo: 'foobarbaz'
        },
        metadata: {
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          timestamp: Date.now(),
          published: true
        },
        custom: {
          foo: 'custom-foobar'
        }
      })).is.false();
    });

    test('returns false when no type is given.', async () => {
      assert.that(Event.isWellformed({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
        },
        name: 'baz',
        id: '37ab3da0-3d04-469b-827d-44230cec53e2',
        data: {
          foo: 'foobarbaz'
        },
        metadata: {
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          timestamp: Date.now(),
          published: true
        },
        custom: {
          foo: 'custom-foobar'
        }
      })).is.false();
    });

    test('returns false when no data is given.', async () => {
      assert.that(Event.isWellformed({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
        },
        name: 'baz',
        id: '37ab3da0-3d04-469b-827d-44230cec53e2',
        type: 'foobar',
        metadata: {
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          timestamp: Date.now(),
          published: true
        },
        custom: {
          foo: 'custom-foobar'
        }
      })).is.false();
    });

    test('returns false when no custom data is given.', async () => {
      assert.that(Event.isWellformed({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
        },
        name: 'baz',
        id: '37ab3da0-3d04-469b-827d-44230cec53e2',
        type: 'foobar',
        data: {
          foo: 'foobarbaz'
        },
        metadata: {
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          timestamp: Date.now(),
          published: true
        }
      })).is.false();
    });

    test('returns false when no metadata is given.', async () => {
      assert.that(Event.isWellformed({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
        },
        name: 'baz',
        id: '37ab3da0-3d04-469b-827d-44230cec53e2',
        type: 'foobar',
        data: {
          foo: 'foobarbaz'
        },
        custom: {
          foo: 'custom-foobar'
        }
      })).is.false();
    });

    test('returns false when no timestamp is given.', async () => {
      assert.that(Event.isWellformed({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
        },
        name: 'baz',
        id: '37ab3da0-3d04-469b-827d-44230cec53e2',
        type: 'foobar',
        data: {
          foo: 'foobarbaz'
        },
        metadata: {
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          published: true
        },
        custom: {
          foo: 'custom-foobar'
        }
      })).is.false();
    });

    test('returns false when no correlation id is given.', async () => {
      assert.that(Event.isWellformed({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
        },
        name: 'baz',
        id: '37ab3da0-3d04-469b-827d-44230cec53e2',
        type: 'foobar',
        data: {
          foo: 'foobarbaz'
        },
        metadata: {
          timestamp: Date.now(),
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          published: true
        },
        custom: {
          foo: 'custom-foobar'
        }
      })).is.false();
    });

    test('returns false when no causation id is given.', async () => {
      assert.that(Event.isWellformed({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
        },
        name: 'baz',
        id: '37ab3da0-3d04-469b-827d-44230cec53e2',
        type: 'foobar',
        data: {
          foo: 'foobarbaz'
        },
        metadata: {
          timestamp: Date.now(),
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          published: true
        },
        custom: {
          foo: 'custom-foobar'
        }
      })).is.false();
    });

    test('returns false when no published is given.', async () => {
      assert.that(Event.isWellformed({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
        },
        name: 'baz',
        id: '37ab3da0-3d04-469b-827d-44230cec53e2',
        type: 'foobar',
        data: {
          foo: 'foobarbaz'
        },
        metadata: {
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          timestamp: Date.now()
        },
        custom: {
          foo: 'custom-foobar'
        }
      })).is.false();
    });

    test('returns true when the event is well-formed.', async () => {
      assert.that(Event.isWellformed({
        context: {
          name: 'foo'
        },
        aggregate: {
          name: 'bar',
          id: '85932442-bf87-472d-8b5a-b0eac3aa8be9'
        },
        name: 'baz',
        id: '37ab3da0-3d04-469b-827d-44230cec53e2',
        type: 'foobar',
        data: {
          foo: 'foobarbaz'
        },
        metadata: {
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          timestamp: Date.now(),
          published: true
        },
        initiator: {
          id: '3815e5b5-3d79-4875-bac2-7a1c9f88048b'
        },
        custom: {
          foo: 'custom-foobar'
        }
      })).is.true();
    });
  });
  /* eslint-enable no-new */
});
