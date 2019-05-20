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
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          revision: 1
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
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          revision: 1
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
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          revision: 1
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
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          revision: 1
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
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          revision: 1
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
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          revision: 1
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
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          revision: 1
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
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          revision: 1
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
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          revision: 1
        }
      });
    }).is.throwing('Correlation id is missing.');
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
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          revision: 1
        }
      });
    }).is.throwing('Causation id is missing.');
  });

  test('throws an error when no revision is given.', async () => {
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
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1'
        }
      });
    }).is.throwing('Revision is missing.');
  });

  test('throws an error when annotations is not an object.', async () => {
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
        annotations: 'foobarbaz',
        metadata: {
          correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          revision: 1
        }
      });
    }).is.throwing('Invalid type: string should be object (at event.annotations).');
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
        causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
        revision: 1
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
    assert.that(actual.annotations).is.equalTo({});
    assert.that(actual.metadata.timestamp).is.ofType('number');
    assert.that(actual.metadata.isPublished).is.false();
    assert.that(actual.metadata.correlationId).is.equalTo('5be0cef4-9051-44ca-a18c-a57c48d711c1');
    assert.that(actual.metadata.causationId).is.equalTo('5be0cef4-9051-44ca-a18c-a57c48d711c1');
    assert.that(actual.metadata.revision).is.equalTo(1);
  });

  test('returns an event with annotations.', async () => {
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
      annotations: {
        client: {
          token: '...',
          user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
          ip: '127.0.0.1'
        }
      },
      metadata: {
        correlationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
        causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
        revision: 1
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
    assert.that(actual.annotations).is.equalTo({
      client: {
        token: '...',
        user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
        ip: '127.0.0.1'
      }
    });
    assert.that(actual.metadata.timestamp).is.ofType('number');
    assert.that(actual.metadata.isPublished).is.false();
    assert.that(actual.metadata.correlationId).is.equalTo('5be0cef4-9051-44ca-a18c-a57c48d711c1');
    assert.that(actual.metadata.causationId).is.equalTo('5be0cef4-9051-44ca-a18c-a57c48d711c1');
    assert.that(actual.metadata.revision).is.equalTo(1);
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
        causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
        revision: 1
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
    assert.that(actual.metadata.timestamp).is.ofType('number');
    assert.that(actual.metadata.isPublished).is.false();
    assert.that(actual.metadata.correlationId).is.equalTo('5be0cef4-9051-44ca-a18c-a57c48d711c1');
    assert.that(actual.metadata.causationId).is.equalTo('5be0cef4-9051-44ca-a18c-a57c48d711c1');
    assert.that(actual.metadata.revision).is.equalTo(1);
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
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          revision: 1
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
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          revision: 1
        }
      });

      const deserializedEvent = JSON.parse(JSON.stringify(event));

      deserializedEvent.metadata.timestamp = 'foo';

      assert.that(() => {
        Event.deserialize(deserializedEvent);
      }).is.throwing('Invalid type: string should be number (at event.metadata.timestamp).');
    });

    test('keeps annotations.', async () => {
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
          causationId: '5be0cef4-9051-44ca-a18c-a57c48d711c1',
          revision: 1
        },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          }
        }
      });

      const deserializedEvent = JSON.parse(JSON.stringify(event));

      const actual = Event.deserialize(deserializedEvent);

      assert.that(actual.annotations).is.equalTo(event.annotations);
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
          isPublished: true,
          revision: 1
        },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          }
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
          isPublished: true,
          revision: 1
        },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          }
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
          isPublished: true,
          revision: 1
        },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          }
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
          isPublished: true,
          revision: 1
        },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          }
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
          isPublished: true,
          revision: 1
        },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          }
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
          isPublished: true,
          revision: 1
        },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          }
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
          isPublished: true,
          revision: 1
        },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          }
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
          isPublished: true,
          revision: 1
        },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          }
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
          isPublished: true,
          revision: 1
        },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          }
        }
      })).is.false();
    });

    test('returns false when no annotations are given.', async () => {
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
          isPublished: true,
          revision: 1
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
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          }
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
          isPublished: true,
          revision: 1
        },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          }
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
          isPublished: true,
          revision: 1
        },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          }
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
          isPublished: true,
          revision: 1
        },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          }
        }
      })).is.false();
    });

    test('returns false when no is published is given.', async () => {
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
          revision: 1
        },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          }
        }
      })).is.false();
    });

    test('returns false when no revision is given.', async () => {
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
          isPublished: true
        },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          }
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
          isPublished: true,
          revision: 1
        },
        annotations: {
          client: {
            token: '...',
            user: { id: 'jane.doe', claims: { sub: 'jane.doe' }},
            ip: '127.0.0.1'
          }
        }
      })).is.true();
    });
  });
  /* eslint-enable no-new */
});
