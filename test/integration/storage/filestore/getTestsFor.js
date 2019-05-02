'use strict';

const path = require('path');

const assert = require('assertthat'),
      { createReadStream } = require('fs-extra'),
      streamToString = require('stream-to-string'),
      uuid = require('uuidv4');

/* eslint-disable mocha/max-top-level-suites */
const getTestsFor = function ({ Filestore, getOptions }) {
  const isAuthorized = {
    commands: {
      removeFile: { forAuthenticated: true, forPublic: true },
      transferOwnership: { forAuthenticated: true, forPublic: true },
      authorize: { forAuthenticated: true, forPublic: true }
    },
    queries: {
      getFile: { forAuthenticated: true, forPublic: true }
    }
  };
  const contentType = 'application/json',
        fileName = 'someFile.json';

  let content,
      contentLength,
      filestore,
      id,
      stream;

  setup(async () => {
    filestore = new Filestore();

    id = uuid();

    const filePath = path.join(__dirname, '..', '..', '..', 'shared', 'files', 'someFile.json');

    content = await streamToString(createReadStream(filePath));
    contentLength = content.length;
    stream = createReadStream(filePath);
  });

  suite('initialize', () => {
    test('does not throw an error.', async () => {
      const options = getOptions();

      await assert.that(async () => {
        await filestore.initialize(options);
      }).is.not.throwingAsync();
    });
  });

  suite('addFile', () => {
    setup(async () => {
      const options = getOptions();

      await filestore.initialize(options);
    });

    test('does not throw an error.', async () => {
      await assert.that(async () => {
        await filestore.addFile({ id, fileName, contentType, isAuthorized, stream });
      }).is.not.throwingAsync();
    });

    test('throws an error if the id is already being used.', async () => {
      await filestore.addFile({ id, fileName, contentType, isAuthorized, stream });

      await assert.that(async () => {
        await filestore.addFile({ id, fileName, contentType, isAuthorized, stream });
      }).is.throwingAsync(ex => ex.code === 'EFILEALREADYEXISTS');
    });
  });

  suite('getMetadata', () => {
    setup(async () => {
      const options = getOptions();

      await filestore.initialize(options);
    });

    test('throws an error if the id does not exist.', async () => {
      await assert.that(async () => {
        await filestore.getMetadata({ id });
      }).is.throwingAsync(ex => ex.code === 'EFILENOTFOUND');
    });

    test('return the metadata.', async () => {
      await filestore.addFile({ id, fileName, contentType, isAuthorized, stream });

      const metadata = await filestore.getMetadata({ id });

      assert.that(metadata).is.equalTo({ id, fileName, contentType, contentLength, isAuthorized });
    });
  });

  suite('getFile', () => {
    setup(async () => {
      const options = getOptions();

      await filestore.initialize(options);
    });

    test('throws an error if the id does not exist.', async () => {
      await assert.that(async () => {
        await filestore.getFile({ id });
      }).is.throwingAsync(ex => ex.code === 'EFILENOTFOUND');
    });

    test('return the file stream.', async () => {
      await filestore.addFile({ id, fileName, contentType, isAuthorized, stream });

      const fileStream = await filestore.getFile({ id });
      const fileData = await streamToString(fileStream);

      assert.that(fileData).is.equalTo(content);
    });
  });

  suite('removeFile', () => {
    setup(async () => {
      const options = getOptions();

      await filestore.initialize(options);
    });

    test('throws an error if the id does not exist.', async () => {
      await assert.that(async () => {
        await filestore.removeFile({ id });
      }).is.throwingAsync(ex => ex.code === 'EFILENOTFOUND');
    });

    test('does not throw an error.', async () => {
      await filestore.addFile({ id, fileName, contentType, isAuthorized, stream });

      await assert.that(async () => {
        await filestore.removeFile({ id });
      }).is.not.throwingAsync();
    });
  });
};
/* eslint-enable mocha/max-top-level-suites */

module.exports = getTestsFor;
