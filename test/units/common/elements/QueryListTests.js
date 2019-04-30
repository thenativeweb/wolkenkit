'use strict';

const assert = require('assertthat');

const { QueryList } = require('../../../../common/elements');

suite('QueryList', () => {
  /* eslint-disable no-new */
  test('throws an error when no list is given.', async () => {
    assert.that(() => {
      new QueryList({
        parameters: {
          where: {},
          orderBy: {},
          skip: 0,
          take: 100
        }
      });
    }).is.throwing('List is missing.');
  });

  test('throws an error when no list name is given.', async () => {
    assert.that(() => {
      new QueryList({
        list: {},
        parameters: {
          where: {},
          orderBy: {},
          skip: 0,
          take: 100
        }
      });
    }).is.throwing('List name is missing.');
  });

  test('throws an error when no parameters are given.', async () => {
    assert.that(() => {
      new QueryList({
        list: {
          name: 'sampleList'
        }
      });
    }).is.throwing('Parameters are missing.');
  });

  test('throws an error when no where is given.', async () => {
    assert.that(() => {
      new QueryList({
        list: {
          name: 'sampleList'
        },
        parameters: {
          orderBy: {},
          skip: 0,
          take: 100
        }
      });
    }).is.throwing('Where is missing.');
  });

  test('throws an error when no order by is given.', async () => {
    assert.that(() => {
      new QueryList({
        list: {
          name: 'sampleList'
        },
        parameters: {
          where: {},
          skip: 0,
          take: 100
        }
      });
    }).is.throwing('Order by is missing.');
  });

  test('throws an error when no skip is given.', async () => {
    assert.that(() => {
      new QueryList({
        list: {
          name: 'sampleList'
        },
        parameters: {
          where: {},
          orderBy: {},
          take: 100
        }
      });
    }).is.throwing('Skip is missing.');
  });

  test('throws an error when no take is given.', async () => {
    assert.that(() => {
      new QueryList({
        list: {
          name: 'sampleList'
        },
        parameters: {
          where: {},
          orderBy: {},
          skip: 0
        }
      });
    }).is.throwing('Take is missing.');
  });
  /* eslint-enable no-new */

  test('returns a query list.', async () => {
    const actual = new QueryList({
      list: {
        name: 'sampleList'
      },
      parameters: {
        where: {},
        orderBy: {},
        skip: 0,
        take: 100
      }
    });

    assert.that(actual).is.ofType('object');
    assert.that(actual.list.name).is.equalTo('sampleList');
    assert.that(actual.parameters.where).is.equalTo({});
    assert.that(actual.parameters.orderBy).is.equalTo({});
    assert.that(actual.parameters.skip).is.equalTo(0);
    assert.that(actual.parameters.take).is.equalTo(100);
  });

  suite('deserialize', () => {
    test('is a function.', async () => {
      assert.that(QueryList.deserialize).is.ofType('function');
    });

    test('returns a real query list object.', async () => {
      const queryList = new QueryList({
        list: {
          name: 'sampleList'
        },
        parameters: {
          where: {},
          orderBy: {},
          skip: 0,
          take: 100
        }
      });

      const deserializedQueryList = JSON.parse(JSON.stringify(queryList));

      const actual = QueryList.deserialize(deserializedQueryList);

      assert.that(actual).is.instanceOf(QueryList);
    });
  });

  suite('isWellformed', () => {
    test('is a function.', async () => {
      assert.that(QueryList.isWellformed).is.ofType('function');
    });

    test('returns false for non-object types.', async () => {
      assert.that(QueryList.isWellformed()).is.false();
    });

    test('returns false for an empty object.', async () => {
      assert.that(QueryList.isWellformed({})).is.false();
    });

    test('returns false when no list is given.', async () => {
      assert.that(QueryList.isWellformed({
        parameters: {
          where: {},
          orderBy: {},
          skip: 0,
          take: 100
        }
      })).is.false();
    });

    test('returns false when no list name is given.', async () => {
      assert.that(QueryList.isWellformed({
        list: {},
        parameters: {
          where: {},
          orderBy: {},
          skip: 0,
          take: 100
        }
      })).is.false();
    });

    test('returns false when no parameters are given.', async () => {
      assert.that(QueryList.isWellformed({
        list: {}
      })).is.false();
    });

    test('returns false when no where is given.', async () => {
      assert.that(QueryList.isWellformed({
        list: {},
        parameters: {
          orderBy: {},
          skip: 0,
          take: 100
        }
      })).is.false();
    });

    test('returns false when no order by is given.', async () => {
      assert.that(QueryList.isWellformed({
        list: {},
        parameters: {
          where: {},
          skip: 0,
          take: 100
        }
      })).is.false();
    });

    test('returns false when no skip is given.', async () => {
      assert.that(QueryList.isWellformed({
        list: {},
        parameters: {
          where: {},
          orderBy: {},
          take: 100
        }
      })).is.false();
    });

    test('returns false when no take is given.', async () => {
      assert.that(QueryList.isWellformed({
        list: {},
        parameters: {
          where: {},
          orderBy: {},
          skip: 0
        }
      })).is.false();
    });

    test('returns true when the query list is well-formed.', async () => {
      assert.that(QueryList.isWellformed({
        list: {
          name: 'sampleList'
        },
        parameters: {
          where: {},
          orderBy: {},
          skip: 0,
          take: 100
        }
      })).is.true();
    });
  });
});
