'use strict';

const path = require('path');

const assert = require('assertthat'),
      uuid = require('uuidv4');

const { Application } = require('../../../../common/application'),
      { QueryList } = require('../../../../common/elements'),
      { validateQueryList } = require('../../../../common/validators');

suite('validateQueryList', () => {
  let application;

  setup(async () => {
    const directory = path.join(__dirname, '..', '..', '..', 'shared', 'applications', 'base');

    application = await Application.load({ directory });
  });

  test('is a function.', async () => {
    assert.that(validateQueryList).is.ofType('function');
  });

  test('throws an error if query list is missing.', async () => {
    assert.that(() => {
      validateQueryList({ application });
    }).is.throwing('Query list is missing.');
  });

  test('throws an error if application is missing.', async () => {
    assert.that(() => {
      validateQueryList({ queryList: {}});
    }).is.throwing('Application is missing.');
  });

  test('throws an error if query list is malformed.', async () => {
    assert.that(() => {
      validateQueryList({ queryList: {}, application });
    }).is.throwing('Malformed query list.');
  });

  test('throws an error if list name is invalid.', async () => {
    assert.that(() => {
      validateQueryList({
        queryList: new QueryList({
          list: { name: 'nonExistent' },
          parameters: {
            where: {},
            orderBy: {},
            skip: 0,
            take: 100
          }
        }),
        application
      });
    }).is.throwing('Invalid query list name.');
  });

  test('throws an error if order by is invalid.', async () => {
    assert.that(() => {
      validateQueryList({
        queryList: new QueryList({
          list: { name: 'sampleList' },
          parameters: {
            where: {},
            orderBy: { sampleField: 'nonExistent' },
            skip: 0,
            take: 100
          }
        }),
        application
      });
    }).is.throwing('No enum match (nonExistent), expects: asc, ascending, desc, descending (at queryList.parameters.orderBy.sampleField).');
  });

  test('throws an error if skip is invalid.', async () => {
    assert.that(() => {
      validateQueryList({
        queryList: new QueryList({
          list: { name: 'sampleList' },
          parameters: {
            where: {},
            orderBy: {},
            skip: -100,
            take: 100
          }
        }),
        application
      });
    }).is.throwing('Value -100 is less than minimum 0 (at queryList.parameters.skip).');
  });

  test('throws an error if take is too small.', async () => {
    assert.that(() => {
      validateQueryList({
        queryList: new QueryList({
          list: { name: 'sampleList' },
          parameters: {
            where: {},
            orderBy: {},
            skip: 0,
            take: 0
          }
        }),
        application
      });
    }).is.throwing('Value 0 is less than minimum 1 (at queryList.parameters.take).');
  });

  test('throws an error if take is too large.', async () => {
    assert.that(() => {
      validateQueryList({
        queryList: new QueryList({
          list: { name: 'sampleList' },
          parameters: {
            where: {},
            orderBy: {},
            skip: 0,
            take: 1000 + 1
          }
        }),
        application
      });
    }).is.throwing('Value 1001 is greater than maximum 1000 (at queryList.parameters.take).');
  });
});
