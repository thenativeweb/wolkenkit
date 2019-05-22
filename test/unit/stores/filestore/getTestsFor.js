'use strict';

const { PassThrough } = require('stream');

const assert = require('assertthat'),
      uuid = require('uuidv4');

/* eslint-disable mocha/max-top-level-suites */
const getTestsFor = function ({ Filestore, type }) {
  let filestore;

  setup(() => {
    filestore = new Filestore();
  });

  test('is a function.', async () => {
    assert.that(Filestore).is.ofType('function');
  });

  suite('initialize', () => {
    test('is a function.', async () => {
      assert.that(filestore.initialize).is.ofType('function');
    });

    if (type === 'S3') {
      test('throws an error if access key is missing.', async () => {
        await assert.that(async () => {
          await filestore.initialize({
            secretKey: 'secret-key'
          });
        }).is.throwingAsync('Access key is missing.');
      });

      test('throws an error if secret key is missing.', async () => {
        await assert.that(async () => {
          await filestore.initialize({
            accessKey: 'access-key'
          });
        }).is.throwingAsync('Secret key is missing.');
      });
    }
  });

  suite('addFile', () => {
    test('is a function.', async () => {
      assert.that(filestore.addFile).is.ofType('function');
    });

    test('throws an error if id is missing.', async () => {
      await assert.that(async () => {
        await filestore.addFile({
          fileName: 'sample.json',
          contentType: 'application/json',
          isAuthorized: {},
          stream: new PassThrough()
        });
      }).is.throwingAsync('Id is missing.');
    });

    test('throws an error if file name is missing.', async () => {
      await assert.that(async () => {
        await filestore.addFile({
          id: uuid(),
          contentType: 'application/json',
          isAuthorized: {},
          stream: new PassThrough()
        });
      }).is.throwingAsync('File name is missing.');
    });

    test('throws an error if content type is missing.', async () => {
      await assert.that(async () => {
        await filestore.addFile({
          id: uuid(),
          fileName: 'sample.json',
          isAuthorized: {},
          stream: new PassThrough()
        });
      }).is.throwingAsync('Content type is missing.');
    });

    test('throws an error if is authorized is missing.', async () => {
      await assert.that(async () => {
        await filestore.addFile({
          id: uuid(),
          fileName: 'sample.json',
          contentType: 'application/json',
          stream: new PassThrough()
        });
      }).is.throwingAsync('Is authorized is missing.');
    });

    test('throws an error if stream is missing.', async () => {
      await assert.that(async () => {
        await filestore.addFile({
          id: uuid(),
          fileName: 'sample.json',
          contentType: 'application/json',
          isAuthorized: {}
        });
      }).is.throwingAsync('Stream is missing.');
    });
  });

  suite('getMetadata', () => {
    test('is a function.', async () => {
      assert.that(filestore.getMetadata).is.ofType('function');
    });

    test('throws an error if id is missing.', async () => {
      await assert.that(async () => {
        await filestore.getMetadata({});
      }).is.throwingAsync('Id is missing.');
    });
  });

  suite('getFile', () => {
    test('is a function.', async () => {
      assert.that(filestore.getFile).is.ofType('function');
    });

    test('throws an error if id is missing.', async () => {
      await assert.that(async () => {
        await filestore.getFile({});
      }).is.throwingAsync('Id is missing.');
    });
  });

  suite('removeFile', () => {
    test('is a function.', async () => {
      assert.that(filestore.removeFile).is.ofType('function');
    });

    test('throws an error if id is missing.', async () => {
      await assert.that(async () => {
        await filestore.removeFile({});
      }).is.throwingAsync('Id is missing.');
    });
  });

  suite('transferOwnership', () => {
    test('is a function.', async () => {
      assert.that(filestore.transferOwnership).is.ofType('function');
    });

    test('throws an error if id is missing.', async () => {
      await assert.that(async () => {
        await filestore.transferOwnership({ to: 'jane.doe' });
      }).is.throwingAsync('Id is missing.');
    });

    test('throws an error if to is missing.', async () => {
      await assert.that(async () => {
        await filestore.transferOwnership({ id: uuid() });
      }).is.throwingAsync('To is missing.');
    });
  });

  suite('authorize', () => {
    test('is a function.', async () => {
      assert.that(filestore.authorize).is.ofType('function');
    });

    test('throws an error if id is missing.', async () => {
      await assert.that(async () => {
        await filestore.authorize({ isAuthorized: {}});
      }).is.throwingAsync('Id is missing.');
    });

    test('throws an error if is authorized is missing.', async () => {
      await assert.that(async () => {
        await filestore.authorize({ id: uuid() });
      }).is.throwingAsync('Is authorized is missing.');
    });
  });
};
/* eslint-enable mocha/max-top-level-suites */

module.exports = getTestsFor;
